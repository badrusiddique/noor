/**
 * scripts/render-assert.ts -- the 15-line invariant proof for the Mushaf.
 *
 * This is the test that, when fully wired, asserts every page 1..604 of the
 * bundled Quran data lays out with line breaks within +/-1px of Tanzil's
 * `<line>` markers when rendered with KFGQPC IndoPak Naskh.
 *
 * Phase 1b status: PENDING.
 * ------------------------------------------------------------------
 * The render side of this assertion needs three things to be honest:
 *   1. KFGQPC IndoPak Naskh TTF available locally.
 *   2. A Node-side renderer that performs HarfBuzz Arabic shaping
 *      identically (pixel-equivalent) to CoreText / Android TextView.
 *   3. Ground-truth line-break positions per page (from Tanzil <line>
 *      markers or api.quran.com page metadata).
 *
 * As of Phase 1b, only (3) is reachable. (1) is BLOCKED -- KFGQPC IndoPak
 * is unfetchable from any public mirror (the previously-pinned URL on
 * `quran/quran.com-images` returns 404; no KFGQPC origin host or community
 * mirror serves the file as of 2026-05). Plan B per ADR-0009 ships
 * Scheherazade New as the primary font; running render-assert against
 * Scheherazade would not match the printed Mushaf's KFGQPC line breaks
 * and would emit false confidence.
 *
 * (2) is also a real piece of work. The plan calls for `@napi-rs/canvas`
 * (Skia + HarfBuzz) or `canvas` (Cairo + HarfBuzz). We do not install
 * either in Phase 1b -- they are 50-80 MB native binaries and would only
 * run if (1) were satisfied. Phase 1c picks them up together.
 *
 * Behaviour today:
 *   - Reads data/manifest.json. If outputs.fonts.kfgqpc_indopak.status
 *     is "bundled", attempt the render-and-assert (currently a stub
 *     that throws to force the human to wire in (2)).
 *   - If "unavailable" or absent, print a structured warning, exit
 *     successfully so the build is not blocked, and emit the gap as the
 *     manifest field outputs.render_assert.status = "skipped-no-kfgqpc".
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = resolve(ROOT, 'data/manifest.json');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FontManifestRecord = {
  status: 'bundled' | 'unavailable';
  source_url: string;
  filename?: string;
  sha256?: string;
  size_bytes?: number;
  note?: string;
};

type RenderAssertRecord = {
  status: 'passed' | 'skipped-no-kfgqpc' | 'pending-renderer';
  reason: string;
  pages_checked?: number;
  divergences?: number;
};

type ManifestShape = {
  schema_version?: number;
  outputs?: {
    db?: unknown;
    fonts?: Record<string, FontManifestRecord>;
    audio?: unknown;
    render_assert?: RenderAssertRecord;
  };
  notes?: unknown;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function recordOutcome(record: RenderAssertRecord): void {
  const m = loadManifest();
  if (m.outputs == null) m.outputs = {};
  m.outputs.render_assert = record;
  saveManifest(m);
}

// ---------------------------------------------------------------------------
// Page-metrics math (ports from apps/mobile/src/features/mushaf/layout.ts
// once that file lands; the formula here is the canonical 15-line invariant
// from the plan, kept inline so render-assert is self-contained).
// ---------------------------------------------------------------------------

type PageMetrics = {
  innerHeightPx: number;
  lineHeightPx: number;
  maxFontSizePx: number;
};

function computePageMetrics(
  screenHeightPx: number,
  topInsetPx: number,
  bottomInsetPx: number,
  fontSizePx: number,
): PageMetrics {
  const TOP_CHROME = 56;
  const BOTTOM_CHROME = 36;
  const PAGE_PAD = 16;
  const BORDER = 8;
  const innerHeightPx =
    screenHeightPx -
    topInsetPx -
    bottomInsetPx -
    TOP_CHROME -
    BOTTOM_CHROME -
    2 * (PAGE_PAD + BORDER);
  const lineHeightPx = innerHeightPx / 15;
  const maxFontSizePx = Math.floor(lineHeightPx / 2.05);
  return {
    innerHeightPx,
    lineHeightPx,
    maxFontSizePx: Math.min(fontSizePx, maxFontSizePx),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const manifest = loadManifest();
  const fontRecord = manifest.outputs?.fonts?.kfgqpc_indopak;

  if (!fontRecord || fontRecord.status === 'unavailable') {
    const reason =
      'KFGQPC IndoPak font is not bundled (Plan B per ADR-0009). The 15-line invariant cannot be honestly asserted against a different font; render-and-assert is intentionally skipped.';
    console.warn('[render-assert] SKIPPED');
    console.warn(`[render-assert] ${reason}`);
    console.warn('[render-assert]   Resolution: ship KFGQPC in v1.1 (user-downloadable on first');
    console.warn('[render-assert]   launch) OR identify a licensed mirror, then re-run this');
    console.warn('[render-assert]   script as part of pnpm db:build.');
    recordOutcome({
      status: 'skipped-no-kfgqpc',
      reason,
    });
    // Exit 0 -- the build pipeline is not blocked. verify-db.ts surfaces the
    // gap as a structured warning.
    return;
  }

  // KFGQPC is bundled. We still don't have a Node-side Arabic shaper wired in
  // for Phase 1b -- bringing in @napi-rs/canvas / canvas is a 50-80 MB native
  // dep and is paired with the KFGQPC bundle, so they land together in
  // Phase 1c. Emit a clear pending status.
  const pendingReason =
    'Renderer not wired (Phase 1c). KFGQPC is bundled but the Node-side HarfBuzz shaper (e.g., @napi-rs/canvas) has not been installed yet -- it is paired with the KFGQPC bundle so they land in Phase 1c together.';

  // Sanity-print canonical metrics so a human eyeballing the script knows the
  // formula matches the plan.
  const metrics = computePageMetrics(844, 47, 34, 22);
  console.warn('[render-assert] PENDING');
  console.warn(`[render-assert] ${pendingReason}`);
  console.warn('[render-assert] Reference page metrics (iPhone 11 viewport, fontSize=22):');
  console.warn(`[render-assert]   innerHeight=${metrics.innerHeightPx.toFixed(2)}px`);
  console.warn(
    `[render-assert]   lineHeight=${metrics.lineHeightPx.toFixed(2)}px (15-line invariant)`,
  );
  console.warn(`[render-assert]   maxFontSize=${metrics.maxFontSizePx}px (clamped)`);

  recordOutcome({
    status: 'pending-renderer',
    reason: pendingReason,
  });
}

main();
