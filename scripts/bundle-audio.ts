/**
 * scripts/bundle-audio.ts — fetches Surah Al-Fatihah Alafasy MP3s and copies them
 * into assets/audio/Alafasy/ so the app has at least one fully-offline reciter
 * on first run.
 *
 * Phase 0: stub. Phase 1 will:
 *   - Read base URLs from data/sources.json.
 *   - Download 001001.mp3 .. 001007.mp3 from everyayah.com/data/Alafasy_64kbps/.
 *   - Verify each file size > 0 and write SHA-256 to data/manifest.json.
 *   - Place files at assets/audio/Alafasy/00100<n>.mp3.
 *   - Total bundle size budget: ~200 KB.
 */

import { resolve } from 'node:path';

const OUT_DIR = resolve(__dirname, '../assets/audio/Alafasy');

async function main() {
  console.warn('[bundle-audio] Phase 0 stub — no audio downloaded.');
  console.warn(`[bundle-audio] Output target: ${OUT_DIR}/001001.mp3 .. 001007.mp3`);
  console.warn('[bundle-audio] Implement in Phase 1.');
}

main().catch((err: unknown) => {
  console.error('[bundle-audio] failed:', err);
  process.exit(1);
});
