/**
 * scripts/bundle-audio.ts -- fetches Surah Al-Fatihah Alafasy MP3s and copies
 * them into assets/audio/Alafasy/ so the app has at least one fully-offline
 * reciter on first run.
 *
 * Phase 1b deliverable B:
 *   - Reads the audio bundle spec from data/sources.json (audio_bundle_alafasy).
 *   - Downloads 001001.mp3 .. 001007.mp3 from everyayah.com/data/Alafasy_64kbps/.
 *   - Sanity-checks each file (5 KB <= size <= 200 KB) before accepting it.
 *   - Computes sha256, writes files to assets/audio/Alafasy/00100<n>.mp3.
 *   - Records sha256 + size into data/manifest.json under outputs.audio.alafasy_fatihah.
 *
 * Idempotent: if a verse is already present and its sha256 matches the manifest,
 * the download is skipped.
 *
 * Total bundle target: ~150 KB.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = resolve(__dirname, '..');
const SOURCES_PATH = resolve(ROOT, 'data/sources.json');
const MANIFEST_PATH = resolve(ROOT, 'data/manifest.json');
const OUT_DIR = resolve(ROOT, 'assets/audio/Alafasy');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_BYTES = 5 * 1024;
const MAX_BYTES = 200 * 1024;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AudioBundleSpec = {
  base_url: string;
  verses: string[];
  license: string;
};

type SourcesFile = {
  schema_version: number;
  audio_bundle_alafasy?: AudioBundleSpec;
};

type AudioVerseRecord = {
  filename: string;
  url: string;
  sha256: string;
  size_bytes: number;
};

type AudioManifestRecord = {
  reciter: string;
  base_url: string;
  bundle_dir: string;
  total_bytes: number;
  verses: Record<string, AudioVerseRecord>;
};

type ManifestShape = {
  schema_version?: number;
  built_at?: string;
  sources?: Record<string, unknown>;
  outputs?: {
    db?: unknown;
    fonts?: unknown;
    audio?: Record<string, AudioManifestRecord>;
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
  const timer = setTimeout(() => controller.abort(), 30_000);
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

function existingShaMatches(filePath: string, expected: string | undefined): boolean {
  if (expected === undefined) return false;
  if (!existsSync(filePath)) return false;
  const buf = readFileSync(filePath);
  return sha256Hex(buf) === expected;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startedAt = Date.now();

  if (!existsSync(SOURCES_PATH)) {
    throw new Error(`Sources manifest missing: ${SOURCES_PATH}`);
  }
  const sources = JSON.parse(readFileSync(SOURCES_PATH, 'utf-8')) as SourcesFile;
  const spec = sources.audio_bundle_alafasy;
  if (!spec) {
    throw new Error('data/sources.json is missing `audio_bundle_alafasy`');
  }
  if (!Array.isArray(spec.verses) || spec.verses.length === 0) {
    throw new Error('audio_bundle_alafasy.verses must be a non-empty string array');
  }

  ensureDir(OUT_DIR);

  const manifest = loadManifest();
  if (manifest.outputs == null) manifest.outputs = {};
  if (manifest.outputs.audio == null) manifest.outputs.audio = {};
  const previous = manifest.outputs.audio['alafasy_fatihah'];
  const previousVerses = previous?.verses ?? {};

  const verseRecords: Record<string, AudioVerseRecord> = {};
  let totalBytes = 0;
  let downloaded = 0;
  let cached = 0;

  for (const code of spec.verses) {
    const filename = `${code}.mp3`;
    const url = `${spec.base_url}${filename}`;
    const destPath = resolve(OUT_DIR, filename);
    const expected = previousVerses[code]?.sha256;

    if (existingShaMatches(destPath, expected)) {
      const stat = statSync(destPath);
      const buf = readFileSync(destPath);
      const sha = sha256Hex(buf);
      verseRecords[code] = {
        filename,
        url,
        sha256: sha,
        size_bytes: stat.size,
      };
      totalBytes += stat.size;
      cached++;
      console.log(
        `[bundle-audio] CACHED  ${filename} (${(stat.size / 1024).toFixed(1)} KB, sha256=${sha.slice(0, 12)}...)`,
      );
      continue;
    }

    console.log(`[bundle-audio] FETCH   ${url}`);
    const buf = await fetchBuffer(url);
    if (buf.length < MIN_BYTES) {
      throw new Error(
        `${filename} too small (${buf.length} bytes; expected >= ${MIN_BYTES}). The CDN may be returning an error page.`,
      );
    }
    if (buf.length > MAX_BYTES) {
      throw new Error(
        `${filename} too large (${buf.length} bytes; expected <= ${MAX_BYTES}). Bundle budget exceeded -- did the reciter or bitrate change?`,
      );
    }
    writeFileSync(destPath, buf);
    const sha = sha256Hex(buf);
    verseRecords[code] = {
      filename,
      url,
      sha256: sha,
      size_bytes: buf.length,
    };
    totalBytes += buf.length;
    downloaded++;
    console.log(
      `[bundle-audio]    -> ${filename} (${(buf.length / 1024).toFixed(1)} KB, sha256=${sha.slice(0, 12)}...)`,
    );
  }

  const record: AudioManifestRecord = {
    reciter: 'alafasy_64',
    base_url: spec.base_url,
    bundle_dir: 'assets/audio/Alafasy/',
    total_bytes: totalBytes,
    verses: verseRecords,
  };
  manifest.outputs.audio['alafasy_fatihah'] = record;
  saveManifest(manifest);

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(
    `[bundle-audio] DONE in ${elapsed}s. ${downloaded} downloaded, ${cached} cached. ` +
      `Total ${(totalBytes / 1024).toFixed(1)} KB across ${spec.verses.length} verses.`,
  );
}

main().catch((err: unknown) => {
  console.error('[bundle-audio] FAILED:', err instanceof Error ? err.stack : err);
  process.exit(1);
});
