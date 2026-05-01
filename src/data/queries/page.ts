/**
 * Page-level read queries for the Mushaf reader.
 *
 * Returns a fully-grouped DTO so the renderer never has to re-walk the
 * verse list — one SQL hit per page, then in-memory grouping.
 *
 * Phase 1a/b note: `verses.line_no` is a sequential 1..N placeholder
 * until Phase 1c lands the render-and-assert pipeline. Renders will be
 * approximate; the exact 15-line invariant is enforced in Phase 2 beta.
 */

import { getDb } from '../db/client';

export type LineSpan = {
  /** Composite verse key, e.g. "2:255". */
  verseId: string;
  surahNo: number;
  ayahNo: number;
  /** Arabic text — text_indopak (Tanzil simple-clean placeholder per Phase 1a/b). */
  text: string;
};

export type SurahHeader = {
  surahNo: number;
  nameAr: string;
  nameTranslit: string;
  revelationPlace: 'makkah' | 'madinah';
  ayahCount: number;
};

export type PageLine = {
  /** 1..N — sequential per page (placeholder ordering until Phase 1c). */
  lineNo: number;
  spans: LineSpan[];
  /** Present when this line begins a new surah (verses.ayah_no = 1 of a surah whose first ayah lands here). */
  surahHeader?: SurahHeader;
  /**
   * Present when this line carries the leading basmala of a non-Tawbah
   * surah other than Al-Fatihah (where the basmala IS verse 1). For
   * those surahs the basmala is rendered as a stand-alone band before
   * the first ayah of the surah.
   */
  basmalaHeader?: boolean;
};

export type PageDTO = {
  pageNo: number;
  juzNo: number;
  hizbNo: number;
  surahStartsOnPage: number[];
  rukusOnPage: number[];
  lines: PageLine[];
};

type VerseRow = {
  id: number;
  surah_no: number;
  ayah_no: number;
  page_no: number;
  line_no: number;
  juz_no: number;
  hizb_no: number;
  text_indopak: string;
};

type SurahRow = {
  number: number;
  name_ar: string;
  name_translit: string;
  revelation_place: string;
  ayah_count: number;
};

type PageRow = {
  page_no: number;
  juz_no: number;
  hizb_no: number;
  surah_starts_on_page: string;
  rukus_on_page: string;
};

/**
 * Loads a single Mushaf page (1..604) as a fully-grouped DTO.
 * One query per table; cheap to call ad-hoc.
 */
export async function getPage(pageNo: number): Promise<PageDTO> {
  if (!Number.isInteger(pageNo) || pageNo < 1 || pageNo > 604) {
    throw new Error(`getPage: pageNo out of range 1..604 (got ${String(pageNo)})`);
  }

  const db = await getDb();

  const versesRes = await db.execute(
    `SELECT id, surah_no, ayah_no, page_no, line_no, juz_no, hizb_no, text_indopak
       FROM verses
      WHERE page_no = ?
      ORDER BY id ASC`,
    [pageNo],
  );
  const verses = versesRes.rows as unknown as VerseRow[];

  if (verses.length === 0) {
    throw new Error(`getPage: no verses found for page ${pageNo}`);
  }

  const pageRes = await db.execute(
    `SELECT page_no, juz_no, hizb_no, surah_starts_on_page, rukus_on_page
       FROM pages
      WHERE page_no = ?`,
    [pageNo],
  );
  const pageRow = (pageRes.rows as unknown as PageRow[])[0];

  // Surahs starting on this page determine which surah headers we render.
  // We always need the surah metadata for any verse with ayah_no = 1.
  const surahNumbers = Array.from(
    new Set(verses.filter((v) => v.ayah_no === 1).map((v) => v.surah_no)),
  );
  let surahMap = new Map<number, SurahHeader>();
  if (surahNumbers.length > 0) {
    const placeholders = surahNumbers.map(() => '?').join(',');
    const surahRes = await db.execute(
      `SELECT number, name_ar, name_translit, revelation_place, ayah_count
         FROM surahs
        WHERE number IN (${placeholders})`,
      surahNumbers,
    );
    surahMap = new Map(
      (surahRes.rows as unknown as SurahRow[]).map((r) => [
        r.number,
        {
          surahNo: r.number,
          nameAr: r.name_ar,
          nameTranslit: r.name_translit,
          revelationPlace: r.revelation_place === 'madinah' ? 'madinah' : 'makkah',
          ayahCount: r.ayah_count,
        },
      ]),
    );
  }

  // Group verses by line_no.
  const linesByNo = new Map<number, PageLine>();
  for (const v of verses) {
    const span: LineSpan = {
      verseId: `${v.surah_no}:${v.ayah_no}`,
      surahNo: v.surah_no,
      ayahNo: v.ayah_no,
      text: v.text_indopak,
    };

    const existing = linesByNo.get(v.line_no);
    if (existing) {
      existing.spans.push(span);
    } else {
      const line: PageLine = {
        lineNo: v.line_no,
        spans: [span],
      };
      // Attach the surah header to the line of the first ayah of a surah,
      // but only when this is the page where that surah begins (i.e. the
      // first ayah lives on this very page — which is exactly the condition
      // ayah_no === 1 implies, since pagination is sequential).
      if (v.ayah_no === 1) {
        const header = surahMap.get(v.surah_no);
        if (header) {
          line.surahHeader = header;
          // Surah 9 (At-Tawbah) has no basmala at all. Surah 1 (Al-Fatihah)
          // has the basmala AS verse 1, so it's already in the line text.
          // Every other surah's basmala is implicit and we render a band.
          if (v.surah_no !== 1 && v.surah_no !== 9) {
            line.basmalaHeader = true;
          }
        }
      }
      linesByNo.set(v.line_no, line);
    }
  }

  const lines = Array.from(linesByNo.values()).sort((a, b) => a.lineNo - b.lineNo);

  return {
    pageNo,
    juzNo: pageRow?.juz_no ?? verses[0]?.juz_no ?? 1,
    hizbNo: pageRow?.hizb_no ?? verses[0]?.hizb_no ?? 1,
    surahStartsOnPage: parseJsonIntArray(pageRow?.surah_starts_on_page),
    rukusOnPage: parseJsonIntArray(pageRow?.rukus_on_page),
    lines,
  };
}

function parseJsonIntArray(raw: string | undefined): number[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => typeof n === 'number' && Number.isInteger(n));
  } catch {
    return [];
  }
}
