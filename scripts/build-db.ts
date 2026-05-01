/**
 * scripts/build-db.ts — generates assets/db/quran.db.
 *
 * Phase 0: stub. Phase 1 will implement:
 *   1. Read pinned URLs + SHA-256 from data/sources.json.
 *   2. Download with content-addressed cache to data/cache/<sha>.xml.
 *   3. Parse Tanzil XML (xml2js) and QuranEnc JSON.
 *   4. Bulk-insert into a fresh better-sqlite3 DB using db/schema.sql.
 *   5. Validate ayah counts, juz/hizb/ruku totals, Al-Fatihah Basmala = ayah 1, At-Tawbah no Basmala.
 *   6. PRAGMA journal_mode = DELETE; VACUUM; ANALYZE.
 *   7. Render-and-assert: open KFGQPC font in node-skia, render every page off-screen,
 *      assert line-break positions match Tanzil's <line> markers within ±1px.
 *   8. Write data/manifest.json with all source/output SHAs.
 *
 * Build fails on any divergence in step 5 or step 7 — those guard the 15-line invariant.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const SOURCES = resolve(ROOT, 'data/sources.json');
const SCHEMA = resolve(ROOT, 'db/schema.sql');
const OUTPUT_DB = resolve(ROOT, 'assets/db/quran.db');

async function main() {
  if (!existsSync(SOURCES)) {
    throw new Error(`Sources manifest missing: ${SOURCES}`);
  }
  if (!existsSync(SCHEMA)) {
    throw new Error(`Schema missing: ${SCHEMA}`);
  }

  console.warn('[build-db] Phase 0 stub — no DB written.');
  console.warn(`[build-db] Output target: ${OUTPUT_DB}`);
  console.warn('[build-db] Implement in Phase 1.');
}

main().catch((err: unknown) => {
  console.error('[build-db] failed:', err);
  process.exit(1);
});
