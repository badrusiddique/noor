/**
 * scripts/verify-db.ts — golden tests for assets/db/quran.db.
 *
 * Phase 0: stub. Phase 1 will:
 *   - Open assets/db/quran.db (must exist; if not, fail with a clear message).
 *   - Assert SELECT COUNT(*) FROM verses == 6236.
 *   - Assert MAX(page_no) == 604, MAX(juz_no) == 30, MAX(hizb_no) == 60.
 *   - Assert ayah counts per surah match canonical vector.
 *   - Assert Al-Fatihah(1):1 text starts with "بسم".
 *   - Assert FTS5 MATCH for "alhamd" returns Q1:2 in <50ms on the build host.
 *   - Assert SHA-256 of assets/db/quran.db matches data/manifest.json.
 *   - Render pages 1, 300, 604 with the bundled font and snapshot to a golden file.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DB_PATH = resolve(__dirname, '../assets/db/quran.db');

async function main() {
  if (!existsSync(DB_PATH)) {
    console.warn('[verify-db] Phase 0 stub — DB not built yet.');
    console.warn('[verify-db] Run `pnpm db:build` first (Phase 1).');
    return;
  }
  console.warn('[verify-db] Phase 0 stub — DB exists but no assertions wired yet.');
}

main().catch((err: unknown) => {
  console.error('[verify-db] failed:', err);
  process.exit(1);
});
