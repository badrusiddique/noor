/**
 * Mushaf page geometry — the 15-line invariant.
 *
 * Per plan §5.3 + ADR-0004: Mushaf mode never reflows. The font size is
 * clamped so 15 lines always fit between the page chrome strips. The user
 * picks `fontSizePref`; we return the largest size that still satisfies
 * the invariant via a 2.05× line-height ratio (chosen for KFGQPC; safe
 * fallback for Scheherazade New too).
 *
 * Phase 2 beta TODO: re-tune `LINE_HEIGHT_RATIO` once KFGQPC IndoPak is
 * sourced (Phase 1c). Scheherazade New has slightly more ascender slack
 * so 2.05 is a defensible alpha default.
 */

export type PageMetricsInput = {
  screenHeight: number;
  topInset: number;
  bottomInset: number;
  fontSizePref: number;
};

export type PageMetrics = {
  /** Height of one of the 15 line bands, in points. */
  lineHeight: number;
  /** Font size after clamping to fit 15 lines. */
  effectiveFontSize: number;
  /** Vertical space available for the 15 line bands (excludes chrome + insets). */
  innerH: number;
};

const TOP_CHROME = 56;
const BOTTOM_CHROME = 36;
const PAGE_PAD = 16;
const BORDER = 8;
const LINE_HEIGHT_RATIO = 2.05;
const MIN_FONT_SIZE = 14;

export function computePageMetrics(opts: PageMetricsInput): PageMetrics {
  const innerH =
    opts.screenHeight -
    opts.topInset -
    opts.bottomInset -
    TOP_CHROME -
    BOTTOM_CHROME -
    2 * (PAGE_PAD + BORDER);

  const safeInnerH = Math.max(innerH, 15 * MIN_FONT_SIZE * LINE_HEIGHT_RATIO);
  const lineHeight = safeInnerH / 15;
  const maxFontSize = Math.max(MIN_FONT_SIZE, Math.floor(lineHeight / LINE_HEIGHT_RATIO));
  const effectiveFontSize = Math.min(opts.fontSizePref, maxFontSize);

  return {
    lineHeight,
    effectiveFontSize,
    innerH: safeInnerH,
  };
}

export const PAGE_LAYOUT_CONSTANTS = {
  TOP_CHROME,
  BOTTOM_CHROME,
  PAGE_PAD,
  BORDER,
  LINE_HEIGHT_RATIO,
  LINE_COUNT: 15,
} as const;
