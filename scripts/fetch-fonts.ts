/**
 * scripts/fetch-fonts.ts -- downloads + verifies Arabic display fonts and
 * places them under assets/fonts/.
 *
 * Phase 1b reality (per ADR-0009 Plan B):
 *   - KFGQPC IndoPak Naskh is currently unfetchable from any public mirror.
 *     The previously-pinned URL on `quran/quran.com-images` returns 404;
 *     no alternative GitHub repo, npm package, or KFGQPC origin host serves
 *     the file as of 2026-05. We therefore SKIP the KFGQPC download and ship
 *     Scheherazade New (SIL OFL 1.1) as the primary Arabic font.
 *   - KFGQPC remains a TODO for v1.1 as a user-downloadable on first launch
 *     (one-time accept + ~4 MB download) once a licensed mirror is identified.
 *
 * Behaviours:
 *   - Idempotent: if assets/fonts/<file>.ttf already matches the recorded
 *     SHA-256 in data/manifest.json, the download is skipped.
 *   - Records sha256 + size_bytes + source URL into data/manifest.json under
 *     `outputs.fonts.<key>` for verify-db.ts to assert against.
 *   - Never throws on the KFGQPC gap; it is recorded explicitly as
 *     `outputs.fonts.kfgqpc_indopak.status = "unavailable"` so verify-db can
 *     emit a structured warning and downstream consumers know to skip
 *     render-and-assert.
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

async function fetchBuffer(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
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
  if (!existsSync(MANIFEST_PATH)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as ManifestShape;
  } catch {
    return {};
  }
}

function saveManifest(m: ManifestShape): void {
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2) + '\n');
}

/**
 * Extracts a single file from a zip archive into a destination path using the
 * system `unzip` binary. Available on macOS + Linux + GitHub Actions Ubuntu
 * runners by default; we avoid pulling in another npm dependency just for this.
 */
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

// ---------------------------------------------------------------------------
// Fetch tasks
// ---------------------------------------------------------------------------

type FetchOutcome = {
  key: string;
  record: FontManifestRecord;
};

async function fetchScheherazade(sources: SourcesFile): Promise<FetchOutcome> {
  const entry = sources.sources['font_scheherazade_new'];
  if (!entry) {
    throw new Error('sources.json missing font_scheherazade_new');
  }
  const filename = 'ScheherazadeNew-Regular.ttf';
  const memberPath = 'ScheherazadeNew-4.500/ScheherazadeNew-Regular.ttf';
  const destPath = resolve(FONTS_DIR, filename);

  console.log(`[fetch-fonts] Scheherazade New: download zip ${entry.url}`);
  const zipBuf = await fetchToCache('scheherazade_new_zip', entry.url);
  console.log(
    `[fetch-fonts]    zip downloaded (${(zipBuf.length / 1024).toFixed(1)} KB), extracting ${memberPath}`,
  );

  // Write the zip to a stable cache location so unzip can read it.
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
      note: 'SIL OFL 1.1. Primary Arabic font for Phase 1b (Plan B per ADR-0009).',
    },
  };
}

function recordKfgqpcGap(sources: SourcesFile): FetchOutcome {
  const entry = sources.sources['font_kfgqpc_indopak'];
  if (!entry) {
    throw new Error('sources.json missing font_kfgqpc_indopak');
  }
  console.warn(
    '[fetch-fonts] KFGQPC IndoPak: SKIPPED (Plan B). No public mirror available as of 2026-05.',
  );
  console.warn(
    '[fetch-fonts]    Recording as outputs.fonts.kfgqpc_indopak.status = "unavailable".',
  );
  return {
    key: 'kfgqpc_indopak',
    record: {
      status: 'unavailable',
      source_url: entry.url,
      note: 'GAP per ADR-0009 Plan B. The pinned URL returns 404; no public CDN, GitHub repo, or KFGQPC origin host serves the IndoPak Naskh TTF as of 2026-05. Deferred to v1.1 as a user-downloadable on first launch.',
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startedAt = Date.now();

  if (!existsSync(SOURCES_PATH)) {
    throw new Error(`Sources manifest missing: ${SOURCES_PATH}`);
  }
  ensureDir(FONTS_DIR);
  ensureDir(CACHE_DIR);

  const sources = JSON.parse(readFileSync(SOURCES_PATH, 'utf-8')) as SourcesFile;

  const outcomes: FetchOutcome[] = [];

  // Scheherazade New (always required).
  outcomes.push(await fetchScheherazade(sources));

  // KFGQPC IndoPak (gap recorded; no fetch attempted because every mirror is
  // currently 404).
  outcomes.push(recordKfgqpcGap(sources));

  // Persist into data/manifest.json without clobbering existing keys.
  const manifest = loadManifest();
  if (manifest.outputs == null) manifest.outputs = {};
  if (manifest.outputs.fonts == null) manifest.outputs.fonts = {};
  for (const o of outcomes) {
    manifest.outputs.fonts[o.key] = o.record;
  }
  saveManifest(manifest);

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(`[fetch-fonts] DONE in ${elapsedSec}s. Manifest updated.`);
  for (const o of outcomes) {
    if (o.record.status === 'bundled') {
      console.log(
        `  bundled  ${o.key.padEnd(20)} ${o.record.filename ?? '?'} (${o.record.size_bytes} bytes)`,
      );
    } else {
      console.log(`  GAP      ${o.key.padEnd(20)} (${o.record.status})`);
    }
  }
}

main().catch((err: unknown) => {
  console.error('[fetch-fonts] FAILED:', err instanceof Error ? err.stack : err);
  process.exit(1);
});
