/**
 * scripts/verify-db.ts -- golden tests for assets/db/quran.db (Phase 1a).
 *
 * Each assertion that fails prints a diff and exits with code 1.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import Database from 'better-sqlite3';

const ROOT = resolve(__dirname, '..');
const DB_PATH = resolve(ROOT, 'assets/db/quran.db');
const MANIFEST_PATH = resolve(ROOT, 'data/manifest.json');

const EXPECTED_VERSES = 6236;
const EXPECTED_PAGE_MAX = 604;
const EXPECTED_JUZ_MAX = 30;
const EXPECTED_HIZB_MAX = 60;
const EXPECTED_SURAHS = 114;
const EXPECTED_TRANSLATIONS = 3;
const VT_MIN = 18_500;
const VT_FLAG = 18_700;
const SIZE_CEILING = 35_000_000;

type Result = { ok: boolean; label: string; detail?: string };

const results: Result[] = [];

function check(label: string, ok: boolean, detail?: string): void {
  results.push(detail === undefined ? { ok, label } : { ok, label, detail });
}

function sha256Hex(buf: Buffer): string {
  const h = createHash('sha256');
  h.update(buf);
  return h.digest('hex');
}

function main(): void {
  if (!existsSync(DB_PATH)) {
    console.error(`[verify-db] DB not found at ${DB_PATH}`);
    console.error('[verify-db] Run `pnpm db:build` first.');
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });

  // PRAGMA user_version
  const uv = db.pragma('user_version', { simple: true }) as number;
  check('PRAGMA user_version == 1', uv === 1, `got ${uv}`);

  // Verses count
  const verses = db.prepare(`SELECT COUNT(*) AS c FROM verses`).get() as {
    c: number;
  };
  check(`verses count == ${EXPECTED_VERSES}`, verses.c === EXPECTED_VERSES, `got ${verses.c}`);

  // Page/juz/hizb maxima
  const maxes = db
    .prepare(`SELECT MAX(page_no) AS p, MAX(juz_no) AS j, MAX(hizb_no) AS h FROM verses`)
    .get() as { p: number; j: number; h: number };
  check(`MAX(page_no) == ${EXPECTED_PAGE_MAX}`, maxes.p === EXPECTED_PAGE_MAX, `got ${maxes.p}`);
  check(`MAX(juz_no) == ${EXPECTED_JUZ_MAX}`, maxes.j === EXPECTED_JUZ_MAX, `got ${maxes.j}`);
  check(`MAX(hizb_no) == ${EXPECTED_HIZB_MAX}`, maxes.h === EXPECTED_HIZB_MAX, `got ${maxes.h}`);

  // Surahs count
  const surahs = db.prepare(`SELECT COUNT(*) AS c FROM surahs`).get() as {
    c: number;
  };
  check(`surahs count == ${EXPECTED_SURAHS}`, surahs.c === EXPECTED_SURAHS, `got ${surahs.c}`);

  // Translations count
  const tCount = db.prepare(`SELECT COUNT(*) AS c FROM translations`).get() as {
    c: number;
  };
  check(
    `translations count == ${EXPECTED_TRANSLATIONS}`,
    tCount.c === EXPECTED_TRANSLATIONS,
    `got ${tCount.c}`,
  );

  // verse_translations >= 18,500 and flag if < 18,700
  const vt = db.prepare(`SELECT COUNT(*) AS c FROM verse_translations`).get() as { c: number };
  check(`verse_translations >= ${VT_MIN}`, vt.c >= VT_MIN, `got ${vt.c}`);
  if (vt.c < VT_FLAG) {
    console.warn(
      `[verify-db] WARN verse_translations=${vt.c} < ${VT_FLAG} (some Basmala-skipping translations are normal; investigate if far below)`,
    );
  }

  // Surah 1 ayah 1 starts with بِسْمِ or بسم
  const fatihah1 = db
    .prepare(`SELECT text_uthmani FROM verses WHERE surah_no = 1 AND ayah_no = 1`)
    .get() as { text_uthmani: string } | undefined;
  const startsBismi =
    fatihah1 != null &&
    (fatihah1.text_uthmani.startsWith('بِسْمِ') || fatihah1.text_uthmani.startsWith('بسم'));
  check(
    'Q1:1 text_uthmani starts with بِسْمِ or بسم',
    startsBismi,
    fatihah1?.text_uthmani.slice(0, 12),
  );

  // FTS5 search: 'الحمد' returns at least one row, including (1, 2)
  const ftsRows = db
    .prepare(
      `SELECT v.surah_no, v.ayah_no
       FROM verses_fts JOIN verses v ON v.id = verses_fts.rowid
       WHERE verses_fts MATCH 'الحمد' LIMIT 50`,
    )
    .all() as { surah_no: number; ayah_no: number }[];
  const has12 = ftsRows.some((r) => r.surah_no === 1 && r.ayah_no === 2);
  check(
    'FTS5 search "الحمد" returns >= 1 row including (1, 2)',
    ftsRows.length >= 1 && has12,
    `rows=${ftsRows.length} has(1,2)=${has12}`,
  );

  // DB size
  const stat = statSync(DB_PATH);
  check(`DB size < ${SIZE_CEILING} bytes`, stat.size < SIZE_CEILING, `got ${stat.size}`);

  // Manifest exists, parses, and DB sha matches
  let manifestOk = true;
  let manifestDetail = '';
  try {
    if (!existsSync(MANIFEST_PATH)) {
      manifestOk = false;
      manifestDetail = 'manifest missing';
    } else {
      const m = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as {
        outputs?: { db?: { sha256?: string } };
      };
      const recorded = m.outputs?.db?.sha256;
      const actual = sha256Hex(readFileSync(DB_PATH));
      if (typeof recorded !== 'string' || recorded.length !== 64) {
        manifestOk = false;
        manifestDetail = 'manifest missing outputs.db.sha256';
      } else if (recorded !== actual) {
        manifestOk = false;
        manifestDetail = `sha mismatch: manifest=${recorded.slice(0, 12)}... actual=${actual.slice(0, 12)}...`;
      }
    }
  } catch (err) {
    manifestOk = false;
    manifestDetail = err instanceof Error ? err.message : String(err);
  }
  check('manifest exists and DB sha256 matches', manifestOk, manifestDetail || undefined);

  db.close();

  // Report
  let failed = 0;
  for (const r of results) {
    if (r.ok) {
      console.log(`  PASS ${r.label}`);
    } else {
      console.log(`  FAIL ${r.label}${r.detail ? ` -- ${r.detail}` : ''}`);
      failed++;
    }
  }
  if (failed > 0) {
    console.error(`[verify-db] ${failed} assertion(s) failed.`);
    process.exit(1);
  }
  console.log('[verify-db] all golden tests passed');
}

main();
