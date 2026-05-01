/**
 * scripts/verify-db.ts -- golden tests for assets/db/quran.db.
 *
 * Phase 1a: 12 base assertions (DB shape, FTS5, manifest integrity).
 * Phase 1b: adds transliteration coverage, transliteration FTS, font asset
 *           manifest checks, audio bundle presence + sha matches, and a
 *           render-assert outcome surfacer (warning, not failure, while the
 *           Plan B path is in effect).
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
const FONTS_DIR = resolve(ROOT, 'assets/fonts');
const AUDIO_BUNDLE_DIR = resolve(ROOT, 'assets/audio/Alafasy');

const EXPECTED_VERSES = 6236;
const EXPECTED_PAGE_MAX = 604;
const EXPECTED_JUZ_MAX = 30;
const EXPECTED_HIZB_MAX = 60;
const EXPECTED_SURAHS = 114;
const EXPECTED_TRANSLATIONS = 3;
const VT_MIN = 18_500;
const VT_FLAG = 18_700;
const SIZE_CEILING = 35_000_000;
const EXPECTED_AUDIO_VERSES = 7; // Surah Al-Fatihah (1:1..1:7)
const AUDIO_FILE_MIN_BYTES = 5 * 1024;
const AUDIO_FILE_MAX_BYTES = 200 * 1024;

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
  type FontRecord = {
    status?: string;
    filename?: string;
    sha256?: string;
    size_bytes?: number;
  };
  type AudioVerseRecord = { filename?: string; sha256?: string; size_bytes?: number };
  type AudioBundleRecord = {
    reciter?: string;
    bundle_dir?: string;
    total_bytes?: number;
    verses?: Record<string, AudioVerseRecord>;
  };
  type RenderAssertRecord = { status?: string; reason?: string };
  type ManifestRoot = {
    outputs?: {
      db?: { sha256?: string; size_bytes?: number };
      fonts?: Record<string, FontRecord>;
      audio?: Record<string, AudioBundleRecord>;
      render_assert?: RenderAssertRecord;
    };
  };

  let manifestOk = true;
  let manifestDetail = '';
  let manifest: ManifestRoot | null = null;
  try {
    if (!existsSync(MANIFEST_PATH)) {
      manifestOk = false;
      manifestDetail = 'manifest missing';
    } else {
      manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as ManifestRoot;
      const recorded = manifest.outputs?.db?.sha256;
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

  // -------------------------------------------------------------------------
  // Phase 1b assertions
  // -------------------------------------------------------------------------

  // 1b.1: transliteration column populated on all 6,236 verses.
  const tlCount = db
    .prepare(
      `SELECT COUNT(*) AS c FROM verses WHERE transliteration IS NOT NULL AND length(transliteration) > 0`,
    )
    .get() as { c: number };
  check(
    `transliteration populated on all ${EXPECTED_VERSES} verses`,
    tlCount.c === EXPECTED_VERSES,
    `got ${tlCount.c}`,
  );

  // 1b.2: FTS5 returns Q1:2 for an English transliteration query, proving the
  // verses_au trigger reflected the column UPDATE.
  const tlFtsRows = db
    .prepare(
      `SELECT v.surah_no, v.ayah_no
       FROM verses_fts JOIN verses v ON v.id = verses_fts.rowid
       WHERE verses_fts MATCH 'transliteration : alhamdu' LIMIT 5`,
    )
    .all() as { surah_no: number; ayah_no: number }[];
  const tlHas12 = tlFtsRows.some((r) => r.surah_no === 1 && r.ayah_no === 2);
  check(
    'FTS5 transliteration search "alhamdu" returns Q1:2',
    tlFtsRows.length >= 1 && tlHas12,
    `rows=${tlFtsRows.length} has(1,2)=${tlHas12}`,
  );

  // 1b.3: Scheherazade font is bundled and matches the manifest sha256.
  const fonts = manifest?.outputs?.fonts ?? {};
  const scheherazade = fonts['scheherazade_new'];
  let fontOk = false;
  let fontDetail = 'manifest missing outputs.fonts.scheherazade_new';
  if (scheherazade?.status === 'bundled' && scheherazade.filename && scheherazade.sha256) {
    const fontPath = resolve(FONTS_DIR, scheherazade.filename);
    if (!existsSync(fontPath)) {
      fontDetail = `font missing on disk: ${fontPath}`;
    } else {
      const actualSha = sha256Hex(readFileSync(fontPath));
      if (actualSha === scheherazade.sha256) {
        fontOk = true;
        fontDetail = '';
      } else {
        fontDetail = `font sha mismatch: manifest=${scheherazade.sha256.slice(0, 12)}... actual=${actualSha.slice(0, 12)}...`;
      }
    }
  }
  check(
    'Scheherazade New font bundled and sha256 matches manifest',
    fontOk,
    fontDetail || undefined,
  );

  // 1b.4: KFGQPC font gap is recorded honestly. We do NOT fail when KFGQPC is
  // unavailable -- this is the documented Plan B per ADR-0009 -- but we
  // require the manifest to record the gap explicitly so Phase 2 / 1c humans
  // see it.
  const kfgqpc = fonts['kfgqpc_indopak'];
  const kfgqpcRecorded =
    kfgqpc != null && (kfgqpc.status === 'unavailable' || kfgqpc.status === 'bundled');
  check(
    'KFGQPC IndoPak font status is recorded in manifest (bundled or unavailable)',
    kfgqpcRecorded,
    kfgqpc == null ? 'no manifest record' : `status=${kfgqpc.status ?? 'undefined'}`,
  );
  if (kfgqpc?.status === 'unavailable') {
    console.warn(
      '[verify-db] WARN KFGQPC IndoPak is unbundled (Plan B per ADR-0009). Render-and-assert is paused; v1.1 will pick up KFGQPC as a user-downloadable.',
    );
  }

  // 1b.5: Audio bundle present (7 files for Surah Al-Fatihah Alafasy) with
  // sha256 + size matching the manifest.
  const audioBundle = manifest?.outputs?.audio?.['alafasy_fatihah'];
  const audioVerses = audioBundle?.verses ?? {};
  const audioCodes = Object.keys(audioVerses);
  check(
    `audio bundle (alafasy_fatihah) has ${EXPECTED_AUDIO_VERSES} verses recorded`,
    audioCodes.length === EXPECTED_AUDIO_VERSES,
    `got ${audioCodes.length}`,
  );
  let audioOk = audioCodes.length === EXPECTED_AUDIO_VERSES;
  let audioDetail = '';
  if (audioOk) {
    for (const code of audioCodes) {
      const rec = audioVerses[code];
      if (!rec || typeof rec.filename !== 'string' || typeof rec.sha256 !== 'string') {
        audioOk = false;
        audioDetail = `verse ${code} record incomplete`;
        break;
      }
      const filePath = resolve(AUDIO_BUNDLE_DIR, rec.filename);
      if (!existsSync(filePath)) {
        audioOk = false;
        audioDetail = `audio file missing: ${filePath}`;
        break;
      }
      const buf = readFileSync(filePath);
      if (buf.length < AUDIO_FILE_MIN_BYTES || buf.length > AUDIO_FILE_MAX_BYTES) {
        audioOk = false;
        audioDetail = `${rec.filename} size ${buf.length} out of [${AUDIO_FILE_MIN_BYTES}, ${AUDIO_FILE_MAX_BYTES}]`;
        break;
      }
      const actualSha = sha256Hex(buf);
      if (actualSha !== rec.sha256) {
        audioOk = false;
        audioDetail = `${rec.filename} sha mismatch: manifest=${rec.sha256.slice(0, 12)}... actual=${actualSha.slice(0, 12)}...`;
        break;
      }
    }
  } else if (audioCodes.length === 0) {
    audioDetail = 'manifest missing outputs.audio.alafasy_fatihah.verses';
  }
  check(
    'audio bundle present and every file matches manifest sha256',
    audioOk,
    audioDetail || undefined,
  );

  // 1b.6: render-assert outcome is recorded (status surfaced as a warning;
  // we do not fail the build while Plan B is in effect).
  const renderAssert = manifest?.outputs?.render_assert;
  const renderRecorded = renderAssert != null && typeof renderAssert.status === 'string';
  check(
    'render-assert outcome recorded in manifest',
    renderRecorded,
    renderRecorded ? `status=${renderAssert?.status}` : 'missing',
  );
  if (renderAssert?.status && renderAssert.status !== 'passed') {
    console.warn(
      `[verify-db] WARN render-assert status=${renderAssert.status}: ${renderAssert.reason ?? '(no reason recorded)'}`,
    );
  }

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
