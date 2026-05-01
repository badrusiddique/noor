# ADR-0004: 15-line invariant — Mushaf font-size slider is clamped, never reflows

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap

## Context

Every printed Mushaf in the IndoPak/Madani tradition is paginated such that page N always contains the same lines — Hafiz muscle memory, page-number references in lessons, juz markers, and ruku marks all assume this. If a digital reader reflows when the user enlarges the font, page numbers stop matching the printed copy, juz boundaries drift, and the user's mental map of the Quran breaks.

A user request to "make the text bigger" is real — small phones, older eyes, low-light reading. Two ways to honor it: (A) reflow the text (each page gets fewer/more lines depending on font size), or (B) clamp font size to whatever fits inside the page's geometry while preserving the 15-line invariant.

This decision must be locked at Phase 0 because it shapes the layout component (`src/features/mushaf/layout.ts`) and the Settings UI surface area.

## Decision

Mushaf mode renders exactly 15 lines per page. The font-size slider is clamped to `[18, maxFontSize]` where `maxFontSize` is computed from screen geometry: `Math.floor((innerHeight / 15) / 2.05)`. Users who want truly large text use **Study mode**, which is a separate route and explicitly does reflow (rendering an FTS-friendly verse list with surrounding context, not page-faithful glyphs).

## Alternatives considered

- **A: Reflow Mushaf mode at the user's chosen font size.** Honors the slider literally. Breaks every page-faithful affordance — page numbers, juz markers, hafiz reference. Rejected.
- **B: Clamp Mushaf, reflow in Study mode (chosen).** Two modes, two contracts. Mushaf is a faithful reproduction of the printed page; Study is a reading surface where typography flexes. Each mode does its job perfectly.
- **C: Allow zoom / pinch-to-zoom on Mushaf without reflowing.** Pages would need to be scrollable when zoomed, which destroys the "swipe forward / back" gesture. Awkward.

## Consequences

Positive: pages render byte-identical to printed copies. Users with hafiz reference points keep them. The build-time render-and-assert test (`scripts/build-db.ts`) can prove ±1px line-break alignment on all 604 pages because the runtime never moves the lines.

Negative: users who want very large text on Mushaf hit the clamp ceiling. Settings explains this and points them to Study mode. Some users will be annoyed; the alternative (broken page references) annoys hafiz / serious students much more.

## Verification

Visual-regression snapshots in CI compare rendered pages to golden images at min, mid, and max font sizes — all 15 lines visible, all line breaks identical. Stop-Ship: any page reflows, do not tag.
