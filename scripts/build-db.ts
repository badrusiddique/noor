/**
 * scripts/build-db.ts -- generates assets/db/quran.db (Phase 1a).
 *
 * Phase 1a scope (this script):
 *   - 114 surahs metadata
 *   - 6,236 verses (Uthmani + simple-clean placeholder for Indo-Pak,
 *     page/juz/hizb/ruku/manzil/sajdah)
 *   - ~77,430 words (text only; transliteration NULL)
 *   - 604 pages with juz/hizb/surah-starts/rukus aggregates
 *   - 3 translations: urdu_raza (Kanzul Iman), urdu_maududi, english_saheeh
 *   - FTS5 verses_fts populated via triggers
 *   - recitations seeded by schema.sql
 *
 * Phase 1b additions (this file):
 *   - Per-verse English transliteration populated into verses.transliteration
 *     (and reflected into verses_fts via the AFTER UPDATE trigger).
 *
 * Still deferred (Phase 1c+):
 *   - Real Indo-Pak orthography text (currently using Tanzil simple-clean).
 *   - Real line_no per page (currently sequential 1..N within each page).
 *     Render-and-assert is the test that would correct this; it is paused in
 *     Phase 1b because KFGQPC IndoPak is unfetchable from public mirrors and
 *     the line-break ground-truth cannot be honestly asserted without it
 *     (see scripts/render-assert.ts and ADR-0009).
 *   - Word-level transliteration (per-verse only in 1b).
 */

import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import Database from 'better-sqlite3';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = resolve(__dirname, '..');
const SOURCES_PATH = resolve(ROOT, 'data/sources.json');
const SCHEMA_PATH = resolve(ROOT, 'db/schema.sql');
const CACHE_DIR = resolve(ROOT, 'data/cache');
const MANIFEST_PATH = resolve(ROOT, 'data/manifest.json');
const OUTPUT_DIR = resolve(ROOT, 'assets/db');
const OUTPUT_DB = resolve(OUTPUT_DIR, 'quran.db');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPECTED_VERSE_TOTAL = 6236;
const EXPECTED_PAGE_MAX = 604;
const EXPECTED_JUZ_MAX = 30;
const EXPECTED_HIZB_MAX = 60;

// Translation specs. Source: Tanzil's /trans/<key> endpoint, which returns the
// full translation in `surah|ayah|text` format (~6,249 lines per file).
//
// QuranEnc was originally specified for Kanzul Iman and Maududi, but as of 2026
// QuranEnc no longer publishes either translation -- only urdu_junagarhi remains.
// Tanzil still hosts all three (ur.kanzuliman, ur.maududi, en.sahih) and uses
// the same `surah|ayah|text` format we already parse for the Arabic text.
type TranslationSpec = {
  id: number;
  source_key: string; // Tanzil trans key
  code: string;
  scholar_name: string;
  scholar_name_ar: string | null;
  language: string;
  license_note: string;
};

const TRANSLATIONS: readonly TranslationSpec[] = [
  {
    id: 1,
    source_key: 'ur.kanzuliman',
    code: 'ur.kanzuliman',
    scholar_name: 'Ahmad Raza Khan (Kanzul Iman)',
    scholar_name_ar: 'أحمد رضا خان',
    language: 'ur',
    license_note: 'Public Domain (d. 1921). Sourced via Tanzil.net (CC-BY-3.0).',
  },
  {
    id: 2,
    source_key: 'ur.maududi',
    code: 'ur.maududi',
    scholar_name: "Sayyid Abul A'la Maududi (Tafhim-ul-Quran)",
    scholar_name_ar: 'أبو الأعلى المودودي',
    language: 'ur',
    license_note: 'Free non-commercial digital distribution. Sourced via Tanzil.net (CC-BY-3.0).',
  },
  {
    id: 3,
    source_key: 'en.sahih',
    code: 'en.sahih',
    scholar_name: 'Saheeh International',
    scholar_name_ar: null,
    language: 'en',
    license_note:
      'Free non-commercial digital distribution with attribution. Saheeh International (1997). Sourced via Tanzil.net (CC-BY-3.0).',
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SourceEntry = {
  url: string;
  sha256: string;
  license: string;
  attribution: string;
  note?: string;
};

type SourcesFile = {
  $comment?: string;
  schema_version: number;
  sources: Record<string, SourceEntry>;
  audio_cdns?: Record<string, string>;
  outputs?: Record<string, string>;
};

type ChapterMeta = {
  id: number;
  revelation_place: 'makkah' | 'madinah';
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: [number, number];
  translated_name?: { name?: string };
};

type QcVerse = {
  id: number;
  verse_number: number;
  verse_key: string;
  page_number: number;
  juz_number: number;
  hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
};

// Tanzil translations come back in the same `surah|ayah|text` format we already
// parse via parseTanzilTxt(), so no extra row type is needed for the wire format.

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function sha256Hex(buf: Buffer | string): string {
  const h = createHash('sha256');
  h.update(buf);
  return h.digest('hex');
}

function logPhase(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  console.log(`[build-db] -> ${name}`);
  return fn().then(() => {
    const ms = Date.now() - start;
    console.log(`[build-db] OK ${name} (${(ms / 1000).toFixed(2)}s)`);
  });
}

async function fetchWithRetry(url: string, attempt = 1): Promise<{ buf: Buffer; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const arr = await res.arrayBuffer();
    return { buf: Buffer.from(arr), status: res.status };
  } catch (err) {
    if (attempt < 2) {
      await sleep(1000);
      return fetchWithRetry(url, attempt + 1);
    }
    throw new Error(`fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timer);
  }
}

type CacheManifestEntry = { url: string; sha256: string; bytes: number };

const fetchManifest = new Map<string, CacheManifestEntry>();

/**
 * Content-addressed cache. Returns the raw response Buffer.
 * The manifest tracks (logical name -> sha256) for the build manifest.
 */
async function fetchWithCache(name: string, url: string): Promise<Buffer> {
  // Look up by URL hash for cache key (so URL changes invalidate)
  const urlKey = sha256Hex(url);
  const cachePath = resolve(CACHE_DIR, `${urlKey}.bin`);
  let buf: Buffer;
  if (existsSync(cachePath)) {
    buf = readFileSync(cachePath);
  } else {
    const res = await fetchWithRetry(url);
    buf = res.buf;
    writeFileSync(cachePath, buf);
  }
  const sha = sha256Hex(buf);
  fetchManifest.set(name, { url, sha256: sha, bytes: buf.length });
  return buf;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

/**
 * Strips Tanzil's transliteration markup. The raw transliteration text uses
 * `<u>...</u>` for long vowels / emphatic consonants and `<b>...</b>` for
 * doubled or assimilated consonants (and includes uppercase variants for
 * mid-word toggles). The DB column stores a plain-ASCII rendering suitable
 * for FTS5, so we drop the tags but keep the wrapped characters.
 */
function stripTanzilTransliterationMarkup(raw: string): string {
  return raw.replace(/<\/?[uUbB]>/g, '');
}

/**
 * Parses Tanzil's `surah|ayah|text` text format. Skips blanks and `#` comment lines.
 */
function parseTanzilTxt(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (line.length === 0) continue;
    if (line.startsWith('#')) continue;
    const parts = line.split('|');
    if (parts.length < 3) continue;
    const surahPart = parts[0];
    const ayahPart = parts[1];
    if (surahPart === undefined || ayahPart === undefined) continue;
    const s = parseInt(surahPart, 10);
    const a = parseInt(ayahPart, 10);
    if (!Number.isInteger(s) || !Number.isInteger(a)) continue;
    if (s < 1 || s > 114 || a < 1) continue;
    const text = parts.slice(2).join('|').trim();
    if (text.length === 0) continue;
    out.set(`${s}:${a}`, text);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const overallStart = Date.now();

  if (!existsSync(SOURCES_PATH)) {
    throw new Error(`Sources manifest missing: ${SOURCES_PATH}`);
  }
  if (!existsSync(SCHEMA_PATH)) {
    throw new Error(`Schema missing: ${SCHEMA_PATH}`);
  }

  ensureDir(CACHE_DIR);
  ensureDir(OUTPUT_DIR);

  const sourcesRaw = readFileSync(SOURCES_PATH, 'utf-8');
  const sources = JSON.parse(sourcesRaw) as SourcesFile;

  // -----------------------------------------------------------------------
  // 1. Fresh DB + schema
  // -----------------------------------------------------------------------
  if (existsSync(OUTPUT_DB)) rmSync(OUTPUT_DB);
  const db = new Database(OUTPUT_DB);

  // Verify FTS5 is compiled in.
  const compileOptsRaw = db.pragma('compile_options') as unknown[];
  const compileOpts = compileOptsRaw.map((o) => {
    if (typeof o === 'string') return o;
    if (
      o !== null &&
      typeof o === 'object' &&
      'compile_options' in o &&
      typeof (o as { compile_options: unknown }).compile_options === 'string'
    ) {
      return (o as { compile_options: string }).compile_options;
    }
    return '';
  });
  if (!compileOpts.some((s) => s.includes('ENABLE_FTS5'))) {
    throw new Error(
      'better-sqlite3 was not compiled with FTS5. Reinstall the package or rebuild from source with FTS5 enabled.',
    );
  }

  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  const schemaSql = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);
  console.log('[build-db] Schema applied (FTS5 verified).');

  // -----------------------------------------------------------------------
  // 2. Tanzil text
  // -----------------------------------------------------------------------

  const tanzilUthmaniUrl =
    sources.sources['tanzil_uthmani']?.url ??
    'https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&zipped=no';
  const tanzilSimpleUrl =
    sources.sources['tanzil_simple_indopak']?.url ??
    'https://tanzil.net/pub/download/index.php?quranType=simple-clean&outType=txt-2&zipped=no';

  let uthmani: Map<string, string> = new Map();
  let indopak: Map<string, string> = new Map();

  await logPhase('download Tanzil Uthmani (txt-2)', async () => {
    const buf = await fetchWithCache('tanzil_uthmani', tanzilUthmaniUrl);
    uthmani = parseTanzilTxt(buf.toString('utf-8'));
    console.log(
      `[build-db]    parsed ${uthmani.size} Uthmani ayahs (${(buf.length / 1024).toFixed(1)} KB)`,
    );
  });

  await logPhase('download Tanzil simple-clean (txt-2)', async () => {
    const buf = await fetchWithCache('tanzil_simple_clean', tanzilSimpleUrl);
    indopak = parseTanzilTxt(buf.toString('utf-8'));
    console.log(
      `[build-db]    parsed ${indopak.size} simple-clean ayahs (${(buf.length / 1024).toFixed(1)} KB)`,
    );
  });

  if (uthmani.size !== EXPECTED_VERSE_TOTAL) {
    throw new Error(
      `Tanzil Uthmani parsed ${uthmani.size} ayahs, expected ${EXPECTED_VERSE_TOTAL}`,
    );
  }
  if (indopak.size !== EXPECTED_VERSE_TOTAL) {
    throw new Error(
      `Tanzil simple-clean parsed ${indopak.size} ayahs, expected ${EXPECTED_VERSE_TOTAL}`,
    );
  }

  // -----------------------------------------------------------------------
  // 3. Quran.com chapters + per-chapter verse metadata (page/juz/hizb/ruku/...)
  // -----------------------------------------------------------------------

  let chapters: ChapterMeta[] = [];
  await logPhase('fetch Quran.com chapters metadata', async () => {
    const buf = await fetchWithCache(
      'quran_com_chapters',
      'https://api.quran.com/api/v4/chapters?language=en',
    );
    const json = JSON.parse(buf.toString('utf-8')) as { chapters?: ChapterMeta[] };
    chapters = json.chapters ?? [];
    if (chapters.length !== 114) {
      throw new Error(`Quran.com chapters returned ${chapters.length}, expected 114`);
    }
  });

  type VerseMeta = {
    surah_no: number;
    ayah_no: number;
    page_no: number;
    juz_no: number;
    hizb_no: number;
    ruku_no: number;
    manzil_no: number;
    sajdah_flag: number;
  };

  const verseMetaByKey = new Map<string, VerseMeta>();

  await logPhase('fetch verse metadata for 114 surahs from Quran.com', async () => {
    for (let s = 1; s <= 114; s++) {
      const url = `https://api.quran.com/api/v4/verses/by_chapter/${s}?per_page=300&fields=page_number,juz_number,hizb_number,ruku_number,manzil_number,sajdah_number,verse_key`;
      const buf = await fetchWithCache(`quran_com_verses_chapter_${s}`, url);
      const json = JSON.parse(buf.toString('utf-8')) as { verses?: QcVerse[] };
      const verses = json.verses ?? [];
      for (const v of verses) {
        const surah = s;
        const ayah = v.verse_number;
        verseMetaByKey.set(`${surah}:${ayah}`, {
          surah_no: surah,
          ayah_no: ayah,
          page_no: v.page_number,
          juz_no: v.juz_number,
          hizb_no: v.hizb_number,
          ruku_no: v.ruku_number,
          manzil_no: v.manzil_number,
          sajdah_flag: v.sajdah_number == null ? 0 : 1,
        });
      }
      // Be polite: small inter-call delay only when we actually hit the network
      // (cache hits are instantaneous); we still delay to avoid bursts on cold runs.
      if (s % 10 === 0) {
        console.log(`[build-db]    surah ${s}/114 metadata ready`);
      }
      await sleep(50);
    }
  });

  if (verseMetaByKey.size !== EXPECTED_VERSE_TOTAL) {
    throw new Error(
      `Quran.com metadata returned ${verseMetaByKey.size} verses, expected ${EXPECTED_VERSE_TOTAL}`,
    );
  }

  // -----------------------------------------------------------------------
  // 4. Insert surahs
  // -----------------------------------------------------------------------

  await logPhase('insert surahs', async () => {
    const stmt = db.prepare(
      `INSERT INTO surahs
       (number, name_ar, name_en, name_translit, revelation_place, ayah_count, juz_start, page_start)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const tx = db.transaction((rows: ChapterMeta[]) => {
      for (const c of rows) {
        // juz_start = juz of (surah, ayah=1)
        const firstMeta = verseMetaByKey.get(`${c.id}:1`);
        if (!firstMeta) {
          throw new Error(`Missing first-ayah metadata for surah ${c.id}`);
        }
        const nameEn = c.translated_name?.name ?? c.name_simple;
        stmt.run(
          c.id,
          c.name_arabic,
          nameEn,
          c.name_simple,
          c.revelation_place,
          c.verses_count,
          firstMeta.juz_no,
          c.pages[0],
        );
      }
    });
    tx(chapters);
  });

  // -----------------------------------------------------------------------
  // 5. Insert verses (single transaction)
  // -----------------------------------------------------------------------

  // We need a stable verse_id mapping for translations + words inserts.
  // We construct id deterministically as (surah * 1000 + ayah) -- safer to let
  // SQLite auto-generate then read back. Use INSERT and capture id via
  // surah/ayah lookup. Easiest: insert in canonical order, expect id = 1..6236.
  await logPhase('insert 6,236 verses', async () => {
    const stmt = db.prepare(
      `INSERT INTO verses
       (surah_no, ayah_no, page_no, line_no, juz_no, hizb_no, ruku_no, manzil_no,
        sajdah_flag, text_uthmani, text_indopak, transliteration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    );

    // Precompute line_no per page: sequential within each page.
    // TODO Phase 1b: replace with real line_no driven by KFGQPC line breaks.
    const pageRunningCount = new Map<number, number>();

    const tx = db.transaction(() => {
      for (let s = 1; s <= 114; s++) {
        const chapter = chapters[s - 1];
        if (!chapter) throw new Error(`Missing chapter ${s}`);
        for (let a = 1; a <= chapter.verses_count; a++) {
          const key = `${s}:${a}`;
          const meta = verseMetaByKey.get(key);
          if (!meta) throw new Error(`Missing meta for ${key}`);
          const u = uthmani.get(key);
          const i = indopak.get(key);
          if (!u) throw new Error(`Missing Uthmani text for ${key}`);
          if (!i) throw new Error(`Missing simple-clean text for ${key}`);
          const next = (pageRunningCount.get(meta.page_no) ?? 0) + 1;
          pageRunningCount.set(meta.page_no, next);
          stmt.run(
            meta.surah_no,
            meta.ayah_no,
            meta.page_no,
            next,
            meta.juz_no,
            meta.hizb_no,
            meta.ruku_no,
            meta.manzil_no,
            meta.sajdah_flag,
            u,
            i,
          );
        }
      }
    });
    tx();
  });

  // Build a (surah, ayah) -> verse.id lookup for downstream inserts.
  const verseIdByKey = new Map<string, number>();
  {
    const rows = db.prepare(`SELECT id, surah_no, ayah_no FROM verses`).all() as {
      id: number;
      surah_no: number;
      ayah_no: number;
    }[];
    for (const r of rows) {
      verseIdByKey.set(`${r.surah_no}:${r.ayah_no}`, r.id);
    }
    if (verseIdByKey.size !== EXPECTED_VERSE_TOTAL) {
      throw new Error(`verses lookup mismatch: ${verseIdByKey.size} != ${EXPECTED_VERSE_TOTAL}`);
    }
  }

  // -----------------------------------------------------------------------
  // 6. Insert words (split text_uthmani on whitespace)
  // -----------------------------------------------------------------------

  await logPhase('insert ~77,430 words', async () => {
    const stmt = db.prepare(
      `INSERT INTO words (verse_id, position, text, transliteration)
       VALUES (?, ?, ?, NULL)`,
    );
    let totalWords = 0;
    const tx = db.transaction(() => {
      for (const [key, verseId] of verseIdByKey) {
        const text = uthmani.get(key);
        if (!text) continue;
        const tokens = text.split(/\s+/).filter((t) => t.length > 0);
        for (let i = 0; i < tokens.length; i++) {
          const tok = tokens[i];
          if (tok === undefined) continue;
          stmt.run(verseId, i + 1, tok);
          totalWords++;
        }
      }
    });
    tx();
    console.log(`[build-db]    inserted ${totalWords} words`);
  });

  // -----------------------------------------------------------------------
  // 7. Insert pages (aggregate from verses)
  // -----------------------------------------------------------------------

  await logPhase('insert 604 pages', async () => {
    type PageAgg = {
      juz: number;
      hizb: number;
      surahStarts: Set<number>;
      rukus: Set<number>;
    };
    const pageAggs = new Map<number, PageAgg>();
    const rows = db
      .prepare(
        `SELECT page_no, juz_no, hizb_no, ruku_no, surah_no, ayah_no FROM verses ORDER BY id`,
      )
      .all() as {
      page_no: number;
      juz_no: number;
      hizb_no: number;
      ruku_no: number;
      surah_no: number;
      ayah_no: number;
    }[];
    for (const r of rows) {
      let agg = pageAggs.get(r.page_no);
      if (!agg) {
        agg = {
          juz: r.juz_no,
          hizb: r.hizb_no,
          surahStarts: new Set<number>(),
          rukus: new Set<number>(),
        };
        pageAggs.set(r.page_no, agg);
      }
      if (r.ayah_no === 1) agg.surahStarts.add(r.surah_no);
      agg.rukus.add(r.ruku_no);
    }
    if (pageAggs.size !== EXPECTED_PAGE_MAX) {
      throw new Error(`pages aggregated: ${pageAggs.size}, expected ${EXPECTED_PAGE_MAX}`);
    }
    const stmt = db.prepare(
      `INSERT INTO pages (page_no, juz_no, hizb_no, surah_starts_on_page, rukus_on_page)
       VALUES (?, ?, ?, ?, ?)`,
    );
    const tx = db.transaction(() => {
      for (let p = 1; p <= EXPECTED_PAGE_MAX; p++) {
        const agg = pageAggs.get(p);
        if (!agg) throw new Error(`Missing page aggregate for ${p}`);
        const surahStarts = JSON.stringify([...agg.surahStarts].sort((a, b) => a - b));
        const rukus = JSON.stringify([...agg.rukus].sort((a, b) => a - b));
        stmt.run(p, agg.juz, agg.hizb, surahStarts, rukus);
      }
    });
    tx();
  });

  // -----------------------------------------------------------------------
  // 8. Insert translations
  // -----------------------------------------------------------------------

  await logPhase('insert translations metadata', async () => {
    const stmt = db.prepare(
      `INSERT INTO translations (id, code, scholar_name, scholar_name_ar, language, license_note)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const tx = db.transaction(() => {
      for (const t of TRANSLATIONS) {
        stmt.run(t.id, t.code, t.scholar_name, t.scholar_name_ar, t.language, t.license_note);
      }
    });
    tx();
  });

  // -----------------------------------------------------------------------
  // 9. Fetch + insert verse_translations from Tanzil (3 single fetches)
  // -----------------------------------------------------------------------

  type TranslationFetchStat = { translation_id: number; rows: number };
  const translationStats: TranslationFetchStat[] = [];

  for (const t of TRANSLATIONS) {
    let inserted = 0;
    await logPhase(`fetch + insert translation: ${t.code}`, async () => {
      const url = `https://tanzil.net/trans/${t.source_key}`;
      const cacheName = `tanzil_trans_${t.source_key}`;
      const buf = await fetchWithCache(cacheName, url);
      const parsed = parseTanzilTxt(buf.toString('utf-8'));
      console.warn(
        `[build-db]    ${t.code}: parsed ${parsed.size} rows (${(buf.length / 1024).toFixed(1)} KB)`,
      );

      const stmt = db.prepare(
        `INSERT INTO verse_translations (verse_id, translation_id, text)
         VALUES (?, ?, ?)`,
      );
      const ftsStmt = db.prepare(`INSERT INTO verse_translations_fts (rowid, text) VALUES (?, ?)`);

      const tx = db.transaction(() => {
        for (const [key, text] of parsed) {
          const verseId = verseIdByKey.get(key);
          if (verseId === undefined) continue;
          stmt.run(verseId, t.id, text);
          // verse_translations is WITHOUT ROWID, so verse_translations_fts
          // is populated explicitly. Encode (translation_id, verse_id) as rowid
          // so each translation's rows live in a non-overlapping rowid range.
          const ftsRowid = t.id * 100000 + verseId;
          ftsStmt.run(ftsRowid, text);
          inserted++;
        }
      });
      tx();

      // Be polite between full-translation downloads on cold runs.
      await sleep(100);
    });
    translationStats.push({ translation_id: t.id, rows: inserted });
  }

  // -----------------------------------------------------------------------
  // 9b. Transliteration (Phase 1b deliverable D)
  // -----------------------------------------------------------------------
  //
  // Tanzil's en.transliteration is per-verse Latin script with markup tags
  // for long vowels / emphatic consonants. We strip the tags and write the
  // plain ASCII into verses.transliteration. The `verses_au` trigger on the
  // table will reflect the new value into verses_fts automatically.

  let transliterationCount = 0;
  await logPhase('fetch + insert per-verse English transliteration', async () => {
    const url = 'https://tanzil.net/trans/en.transliteration';
    const buf = await fetchWithCache('tanzil_trans_en.transliteration', url);
    const parsed = parseTanzilTxt(buf.toString('utf-8'));
    console.log(
      `[build-db]    transliteration: parsed ${parsed.size} rows (${(buf.length / 1024).toFixed(1)} KB)`,
    );
    if (parsed.size < EXPECTED_VERSE_TOTAL - 30) {
      throw new Error(
        `transliteration parsed ${parsed.size} rows; expected ~${EXPECTED_VERSE_TOTAL}. Tanzil corpus may have shifted.`,
      );
    }

    const stmt = db.prepare(`UPDATE verses SET transliteration = ? WHERE id = ?`);
    const tx = db.transaction(() => {
      for (const [key, raw] of parsed) {
        const verseId = verseIdByKey.get(key);
        if (verseId === undefined) continue;
        const cleaned = stripTanzilTransliterationMarkup(raw).trim();
        if (cleaned.length === 0) continue;
        stmt.run(cleaned, verseId);
        transliterationCount++;
      }
    });
    tx();
    console.log(`[build-db]    populated transliteration on ${transliterationCount} verses`);
  });

  // -----------------------------------------------------------------------
  // 10. Validate
  // -----------------------------------------------------------------------

  await logPhase('validate', async () => {
    const v = db.prepare(`SELECT COUNT(*) AS c FROM verses`).get() as {
      c: number;
    };
    if (v.c !== EXPECTED_VERSE_TOTAL) {
      throw new Error(`verses count ${v.c} != ${EXPECTED_VERSE_TOTAL}`);
    }
    const maxRow = db
      .prepare(`SELECT MAX(page_no) AS p, MAX(juz_no) AS j, MAX(hizb_no) AS h FROM verses`)
      .get() as { p: number; j: number; h: number };
    if (maxRow.p !== EXPECTED_PAGE_MAX) {
      throw new Error(`MAX(page_no)=${maxRow.p} != ${EXPECTED_PAGE_MAX}`);
    }
    if (maxRow.j !== EXPECTED_JUZ_MAX) {
      throw new Error(`MAX(juz_no)=${maxRow.j} != ${EXPECTED_JUZ_MAX}`);
    }
    if (maxRow.h !== EXPECTED_HIZB_MAX) {
      throw new Error(`MAX(hizb_no)=${maxRow.h} != ${EXPECTED_HIZB_MAX}`);
    }

    const surahs = db.prepare(`SELECT COUNT(*) AS c FROM surahs`).get() as {
      c: number;
    };
    if (surahs.c !== 114) {
      throw new Error(`surahs count ${surahs.c} != 114`);
    }

    // Per-surah ayah count parity vs. surahs.ayah_count
    const perSurah = db
      .prepare(
        `SELECT s.number, s.ayah_count AS expected, COUNT(v.id) AS actual
         FROM surahs s LEFT JOIN verses v ON v.surah_no = s.number
         GROUP BY s.number ORDER BY s.number`,
      )
      .all() as { number: number; expected: number; actual: number }[];
    for (const r of perSurah) {
      if (r.expected !== r.actual) {
        throw new Error(
          `Surah ${r.number}: ayah count mismatch expected=${r.expected} actual=${r.actual}`,
        );
      }
    }

    // Translations row counts
    const vt = db.prepare(`SELECT COUNT(*) AS c FROM verse_translations`).get() as { c: number };
    const expectedTotal = EXPECTED_VERSE_TOTAL * TRANSLATIONS.length;
    const minAccept = expectedTotal - 30; // small wiggle for QuranEnc edge cases
    if (vt.c < minAccept) {
      throw new Error(
        `verse_translations count ${vt.c} below tolerance ${minAccept} (expected ~${expectedTotal})`,
      );
    }
    if (vt.c > expectedTotal + 30) {
      throw new Error(`verse_translations count ${vt.c} unexpectedly high (>${expectedTotal})`);
    }

    // FTS5 sanity
    const fts = db.prepare(`SELECT COUNT(*) AS c FROM verses_fts`).get() as { c: number };
    if (fts.c !== EXPECTED_VERSE_TOTAL) {
      throw new Error(
        `verses_fts count ${fts.c} != ${EXPECTED_VERSE_TOTAL} (triggers may not have fired)`,
      );
    }

    // Transliteration coverage
    const tl = db
      .prepare(
        `SELECT COUNT(*) AS c FROM verses WHERE transliteration IS NOT NULL AND length(transliteration) > 0`,
      )
      .get() as { c: number };
    if (tl.c !== EXPECTED_VERSE_TOTAL) {
      throw new Error(
        `transliteration populated on ${tl.c} verses; expected exactly ${EXPECTED_VERSE_TOTAL}`,
      );
    }

    // FTS5 search across transliteration column should hit Q1:2 for "alhamdu" or "rabbi".
    const tlFts = db
      .prepare(
        `SELECT v.surah_no, v.ayah_no
         FROM verses_fts JOIN verses v ON v.id = verses_fts.rowid
         WHERE verses_fts MATCH 'transliteration : alhamdu' LIMIT 5`,
      )
      .all() as { surah_no: number; ayah_no: number }[];
    const tlHas12 = tlFts.some((r) => r.surah_no === 1 && r.ayah_no === 2);
    if (!tlHas12) {
      throw new Error(
        `FTS5 transliteration search for "alhamdu" did not hit Q1:2 (found ${tlFts.length} rows)`,
      );
    }

    console.log(
      `[build-db]    verses=${v.c} pages_max=${maxRow.p} juz_max=${maxRow.j} hizb_max=${maxRow.h}`,
    );
    console.log(`[build-db]    surahs=${surahs.c} verse_translations=${vt.c} verses_fts=${fts.c}`);
    for (const ts of translationStats) {
      console.log(`[build-db]    translation_id=${ts.translation_id}: ${ts.rows} rows`);
    }
  });

  // -----------------------------------------------------------------------
  // 11. Optimize
  // -----------------------------------------------------------------------

  await logPhase('optimize (DELETE journal, VACUUM, ANALYZE)', async () => {
    db.pragma('journal_mode = DELETE');
    db.exec('VACUUM');
    db.exec('ANALYZE');
  });

  db.close();

  // Size check
  const stat = statSync(OUTPUT_DB);
  const sizeMb = stat.size / (1024 * 1024);
  console.log(`[build-db] DB size: ${sizeMb.toFixed(2)} MB`);
  if (stat.size > 35 * 1024 * 1024) {
    throw new Error(`DB size ${sizeMb.toFixed(2)}MB exceeds 35MB ceiling`);
  }

  // -----------------------------------------------------------------------
  // 12. Manifest
  // -----------------------------------------------------------------------

  const dbBuf = readFileSync(OUTPUT_DB);
  const dbSha = sha256Hex(dbBuf);

  const manifest = {
    schema_version: 1,
    built_at: new Date().toISOString(),
    sources: Object.fromEntries(
      [...fetchManifest.entries()].map(([k, v]) => [
        k,
        { url: v.url, sha256: v.sha256, bytes: v.bytes },
      ]),
    ),
    outputs: {
      db: {
        path: 'assets/db/quran.db',
        sha256: dbSha,
        size_bytes: stat.size,
      },
    },
    notes: {
      phase: '1b',
      placeholders: [
        'text_indopak uses Tanzil simple-clean (true Indo-Pak orthography deferred to Phase 1c -- KFGQPC IndoPak font is unfetchable from public mirrors as of 2026-05)',
        'line_no is sequential per page (render-and-assert paused -- see scripts/render-assert.ts; Plan B per ADR-0009)',
        'verses.transliteration is populated from Tanzil en.transliteration; words.transliteration remains NULL (word-level deferred to v2 word-tap)',
      ],
    },
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`[build-db] manifest: ${MANIFEST_PATH}`);

  const totalSec = ((Date.now() - overallStart) / 1000).toFixed(2);
  console.log(`[build-db] DONE in ${totalSec}s. quran.db -> ${OUTPUT_DB}`);
}

main().catch((err: unknown) => {
  console.error('[build-db] FAILED:', err instanceof Error ? err.stack : err);
  process.exit(1);
});
