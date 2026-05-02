/**
 * scripts/fetch-fonts.ts -- downloads + verifies Arabic display fonts and
 * places them under assets/fonts/.
 *
 * Phase 1c font strategy (per ADR-0009):
 *   Plan A: KFGQPC IndoPak Naskh — tried from multiple candidate mirrors.
 *           If any succeeds, it becomes the primary Mushaf font.
 *   Plan B: Amiri Quran (SIL OFL 1.1) — a dedicated high-quality Quran
 *           typesetting font, much closer to printed Mushaf style than
 *           Scheherazade New. Downloaded from alif-type/amiri on GitHub.
 *   Plan C: Scheherazade New (SIL OFL 1.1) — always downloaded as the
 *           guaranteed fallback.
 *
 * The `typography.kfgqpcIndoPak` token is used in MushafLine when the font
 * file exists; otherwise it falls back to `typography.amiriQuran`, then
 * `typography.scheherazadeNew`.
 *
 * Behaviours:
 *   - Idempotent: skips download if the file already exists at destPath.
 *   - Records sha256 + size_bytes + source URL into data/manifest.json under
 *     `outputs.fonts.<key>` for verify-db.ts to assert against.
 *   - Never throws on a failed KFGQPC attempt; records status = "unavailable"
 *     so downstream knows to skip render-and-assert.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = resolve(__dirname, '..');
const SOURCES_PATH = resolve(ROOT, 'data/sources.json');
const MANIFEST_PATH = resolve(ROOT, 'data/manifest.json');
const CACHE_DIR = resolve(ROOT, 'data/cache');
const FONTS_DIR = resolve(ROOT, 'assets/fonts');

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
  schema_version: number;
  sources: Record<string, SourceEntry>;
};

type FontManifestRecord = {
  status: 'bundled' | 'unavailable';
  source_url: string;
  filename?: string;
  sha256?: string;
  size_bytes?: number;
  note?: string;
};

type ManifestShape = {
  schema_version?: number;
  built_at?: string;
  sources?: Record<string, unknown>;
  outputs?: {
    db?: unknown;
    fonts?: Record<string, FontManifestRecord>;
    audio?: unknown;
  };
  notes?: unknown;
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function sha256Hex(buf: Buffer): string {
  const h = createHash('sha256');
  h.update(buf);
  return h.digest('hex');
}

async function fetchBuffer(url: string, timeoutMs = 30_000): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchToCache(name: string, url: string): Promise<Buffer> {
  ensureDir(CACHE_DIR);
  const urlKey = sha256Hex(Buffer.from(url));
  const cachePath = resolve(CACHE_DIR, `font_${name}_${urlKey.slice(0, 12)}.bin`);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath);
  }
  const buf = await fetchBuffer(url);
  writeFileSync(cachePath, buf);
  return buf;
}

function loadManifest(): ManifestShape {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as ManifestShape;
  } catch {
    return {};
  }
}

function saveManifest(m: ManifestShape): void {
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2) + '\n');
}

function extractFromZip(zipPath: string, memberPath: string, destPath: string): void {
  const tmp = resolve(tmpdir(), `noor-fonts-${process.pid}-${Date.now()}`);
  ensureDir(tmp);
  execFileSync('unzip', ['-o', '-q', zipPath, memberPath, '-d', tmp]);
  const extracted = resolve(tmp, memberPath);
  if (!existsSync(extracted)) {
    throw new Error(`unzip produced no file at ${extracted}`);
  }
  const buf = readFileSync(extracted);
  writeFileSync(destPath, buf);
}

// Validates that a buffer is a plausible TTF/OTF binary (starts with known magic bytes).
function looksLikeFont(buf: Buffer): boolean {
  if (buf.length < 16) return false;
  // TrueType: 0x00010000  or "true" (0x74727565)
  // OpenType CFF: "OTTO" (0x4F54544F)
  const magic = buf.readUInt32BE(0);
  return magic === 0x00010000 || magic === 0x74727565 || magic === 0x4f54544f;
}

// ---------------------------------------------------------------------------
// Fetch tasks
// ---------------------------------------------------------------------------

type FetchOutcome = {
  key: string;
  record: FontManifestRecord;
};

/** Try multiple candidate URLs for KFGQPC IndoPak Naskh. */
async function tryFetchKfgqpc(): Promise<FetchOutcome> {
  const CANDIDATES = [
    // jsDelivr CDN mirror of quran.com-images — most reliable GH CDN
    'https://cdn.jsdelivr.net/gh/quran/quran.com-images@master/fonts/kfgqpc-indopak/KFGQPC-IndoPak.ttf',
    // Raw GitHub — quran.com-images repo (original path, may have moved)
    'https://raw.githubusercontent.com/quran/quran.com-images/master/fonts/kfgqpc-indopak/KFGQPC-IndoPak.ttf',
    // Alternative path variant
    'https://raw.githubusercontent.com/quran/quran.com-images/master/fonts/KFGQPC-IndoPak.ttf',
    // quranapp GitHub (Android app bundled assets)
    'https://raw.githubusercontent.com/quranapp/quran-android/main/app/src/main/assets/fonts/hafs/KFGQPC-IndoPak.ttf',
  ];

  const destPath = resolve(FONTS_DIR, 'KFGQPC-IndoPak.ttf');

  for (const url of CANDIDATES) {
    try {
      console.log(`[fetch-fonts] KFGQPC: trying ${url}`);
      const buf = await fetchBuffer(url, 15_000);
      if (!looksLikeFont(buf)) {
        console.warn(
          `[fetch-fonts]    response is not a font file (${buf.length} bytes), skipping`,
        );
        continue;
      }
      writeFileSync(destPath, buf);
      const sha = sha256Hex(buf);
      const size = buf.length;
      console.log(
        `[fetch-fonts]    SUCCESS: ${(size / 1024).toFixed(1)} KB, sha256=${sha.slice(0, 12)}...`,
      );
      return {
        key: 'kfgqpc_indopak',
        record: {
          status: 'bundled',
          source_url: url,
          filename: 'KFGQPC-IndoPak.ttf',
          sha256: sha,
          size_bytes: size,
          note: 'KFGQPC IndoPak Naskh. Free for Quranic display use with attribution.',
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[fetch-fonts]    ${msg}`);
    }
  }

  console.warn(
    '[fetch-fonts] KFGQPC: all mirrors failed — recording as unavailable (Plan B active).',
  );
  return {
    key: 'kfgqpc_indopak',
    record: {
      status: 'unavailable',
      source_url: CANDIDATES[0] ?? '',
      note: 'GAP per ADR-0009 Plan B. All candidate mirrors returned non-font responses as of 2026-05. Amiri Quran is the active fallback.',
    },
  };
}

/** Fetch Amiri Quran (alif-type/amiri on GitHub, SIL OFL 1.1). */
async function fetchAmiriQuran(): Promise<FetchOutcome> {
  const CANDIDATES = [
    // Google Fonts static — versioned CDN (v19 confirmed working 2026-05)
    'https://fonts.gstatic.com/s/amiriquran/v19/_Xmo-Hk0rD6DbUL4_vH8Zq5t.ttf',
    // Direct from alif-type/amiri repo
    'https://raw.githubusercontent.com/alif-type/amiri/main/fonts/quran/AmiriQuran.ttf',
    // jsDelivr mirror
    'https://cdn.jsdelivr.net/gh/alif-type/amiri@main/fonts/quran/AmiriQuran.ttf',
  ];

  const destPath = resolve(FONTS_DIR, 'AmiriQuran.ttf');

  // Skip if already present
  if (existsSync(destPath)) {
    const existing = readFileSync(destPath);
    const sha = sha256Hex(existing);
    console.log(
      `[fetch-fonts] Amiri Quran: already present (${(existing.length / 1024).toFixed(1)} KB)`,
    );
    return {
      key: 'amiri_quran',
      record: {
        status: 'bundled',
        source_url: CANDIDATES[0] ?? '',
        filename: 'AmiriQuran.ttf',
        sha256: sha,
        size_bytes: existing.length,
        note: 'Amiri Quran (SIL OFL 1.1, alif-type). High-quality dedicated Quran typesetting font. Active fallback when KFGQPC is unavailable.',
      },
    };
  }

  for (const url of CANDIDATES) {
    try {
      console.log(`[fetch-fonts] Amiri Quran: trying ${url}`);
      const buf = await fetchBuffer(url, 20_000);
      if (!looksLikeFont(buf)) {
        console.warn(
          `[fetch-fonts]    response is not a font file (${buf.length} bytes), skipping`,
        );
        continue;
      }
      writeFileSync(destPath, buf);
      const sha = sha256Hex(buf);
      console.log(
        `[fetch-fonts]    SUCCESS: ${(buf.length / 1024).toFixed(1)} KB, sha256=${sha.slice(0, 12)}...`,
      );
      return {
        key: 'amiri_quran',
        record: {
          status: 'bundled',
          source_url: url,
          filename: 'AmiriQuran.ttf',
          sha256: sha,
          size_bytes: buf.length,
          note: 'Amiri Quran (SIL OFL 1.1, alif-type). Active fallback when KFGQPC is unavailable.',
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[fetch-fonts]    ${msg}`);
    }
  }

  console.warn(
    '[fetch-fonts] Amiri Quran: all mirrors failed — Scheherazade New is the only fallback.',
  );
  return {
    key: 'amiri_quran',
    record: {
      status: 'unavailable',
      source_url: CANDIDATES[0] ?? '',
      note: 'All mirrors failed. Scheherazade New is the active fallback.',
    },
  };
}

async function fetchScheherazade(sources: SourcesFile): Promise<FetchOutcome> {
  const entry = sources.sources['font_scheherazade_new'];
  if (!entry) throw new Error('sources.json missing font_scheherazade_new');

  const filename = 'ScheherazadeNew-Regular.ttf';
  const memberPath = 'ScheherazadeNew-4.500/ScheherazadeNew-Regular.ttf';
  const destPath = resolve(FONTS_DIR, filename);

  // Skip if already present and valid.
  if (existsSync(destPath)) {
    const existing = readFileSync(destPath);
    if (looksLikeFont(existing)) {
      const sha = sha256Hex(existing);
      console.log(
        `[fetch-fonts] Scheherazade New: already present (${(existing.length / 1024).toFixed(1)} KB)`,
      );
      return {
        key: 'scheherazade_new',
        record: {
          status: 'bundled',
          source_url: entry.url,
          filename,
          sha256: sha,
          size_bytes: existing.length,
        },
      };
    }
  }

  console.log(`[fetch-fonts] Scheherazade New: downloading zip from ${entry.url}`);
  const zipBuf = await fetchToCache('scheherazade_new_zip', entry.url);
  const zipCachePath = resolve(CACHE_DIR, 'scheherazade_new.zip');
  writeFileSync(zipCachePath, zipBuf);
  extractFromZip(zipCachePath, memberPath, destPath);

  const ttfBuf = readFileSync(destPath);
  const sha = sha256Hex(ttfBuf);
  const stat = statSync(destPath);
  console.log(
    `[fetch-fonts]    ${filename}: ${(stat.size / 1024).toFixed(1)} KB, sha256=${sha.slice(0, 12)}...`,
  );

  return {
    key: 'scheherazade_new',
    record: {
      status: 'bundled',
      source_url: entry.url,
      filename,
      sha256: sha,
      size_bytes: stat.size,
      note: 'SIL OFL 1.1. Ultimate fallback Arabic font (Plan C).',
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startedAt = Date.now();

  if (!existsSync(SOURCES_PATH)) throw new Error(`Sources manifest missing: ${SOURCES_PATH}`);
  ensureDir(FONTS_DIR);
  ensureDir(CACHE_DIR);

  const sources = JSON.parse(readFileSync(SOURCES_PATH, 'utf-8')) as SourcesFile;

  // Fetch in parallel where possible, then record outcomes.
  const [scheherazade, amiriQuran, kfgqpc] = await Promise.all([
    fetchScheherazade(sources),
    fetchAmiriQuran(),
    tryFetchKfgqpc(),
  ]);

  const outcomes: FetchOutcome[] = [scheherazade, amiriQuran, kfgqpc];

  const manifest = loadManifest();
  if (manifest.outputs == null) manifest.outputs = {};
  if (manifest.outputs.fonts == null) manifest.outputs.fonts = {};
  for (const o of outcomes) {
    manifest.outputs.fonts[o.key] = o.record;
  }
  saveManifest(manifest);

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(`\n[fetch-fonts] DONE in ${elapsed}s. Active font chain:`);
  for (const o of outcomes) {
    const status = o.record.status === 'bundled' ? '✓ bundled ' : '✗ missing ';
    const file = o.record.filename != null ? o.record.filename : '(unavailable)';
    console.log(`  ${status}  ${o.key.padEnd(22)}  ${file}`);
  }

  const kfgqpcAvailable = kfgqpc.record.status === 'bundled';
  const amiriAvailable = amiriQuran.record.status === 'bundled';
  const activePrimary = kfgqpcAvailable
    ? 'KFGQPC-IndoPak.ttf (Plan A ✓)'
    : amiriAvailable
      ? 'AmiriQuran.ttf (Plan B)'
      : 'ScheherazadeNew-Regular.ttf (Plan C)';
  console.log(`\n  Active primary font: ${activePrimary}`);
  if (!kfgqpcAvailable) {
    console.warn(
      '\n  NOTE: KFGQPC IndoPak is unavailable. The app will use Amiri Quran or Scheherazade New.\n' +
        '  The visual style will differ slightly from the Pakistani printed Mushaf.\n' +
        '  To adopt KFGQPC: obtain the TTF, place it at assets/fonts/KFGQPC-IndoPak.ttf,\n' +
        '  then add it to useFonts() in app/_layout.tsx under the "KFGQPC-IndopakNaskh" key.',
    );
  }
}

main().catch((err: unknown) => {
  console.error('[fetch-fonts] FAILED:', err instanceof Error ? err.stack : err);
  process.exit(1);
});
