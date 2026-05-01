# ADR-0007: `@gorhom/bottom-sheet` v5 for translation drawer + modal sheets

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap

## Context

Noor has multiple bottom-sheet surfaces: the translation drawer (closed / peek 38px / expanded 38%), the verse-action sheet, the share sheet, and the note editor. The translation drawer in particular has hard requirements — gesture coexistence with `react-native-pager-view`, snap points, programmatic open/close, and a sticky footer for translation credits.

Three options exist in 2026. (A) The OS-native action sheet (`@expo/react-native-action-sheet`) — works for the share sheet, too limited for the drawer. (B) Hand-rolled with Reanimated v3. Maximum flexibility, weeks of work to reach feature parity, lifetime of bug-fixing. (C) `@gorhom/bottom-sheet` v5 — Reanimated v3 native, snap points, scroll-bridging, dismiss-on-back, `BottomSheetModalProvider`.

Gorhom's bottom sheet is the de-facto standard in 2026 React Native. v5 added new-arch support and stable scroll-bridging.

## Decision

Use `@gorhom/bottom-sheet` v5 for the translation drawer, verse-action sheet, share sheet, and note editor. Mount `BottomSheetModalProvider` once at the root layout. Pair with `react-native-gesture-handler` v2 and `react-native-reanimated` v3 (both already in the dependency tree for the pager and animations).

The translation drawer's three states use `snapPoints={[38, '38%']}` plus a closed fourth state via `dismiss()`. Scholar picker and note editor are modal **routes**, not sheets — a long list / multi-line input deserves a full screen, not a partial overlay.

## Alternatives considered

- **A: OS action sheet only.** Insufficient for the drawer.
- **B: Hand-rolled.** Weeks of work, ongoing maintenance burden.
- **C: `@gorhom/bottom-sheet` v5 (chosen).** Battle-tested, well-maintained, matches our use cases.

## Consequences

Positive: drawer and sheet UX is consistent and matches user expectations. Scroll-bridging means the translation list scrolls naturally when the drawer is expanded. Back button dismisses on Android.

Negative: gesture interactions with the pager need explicit configuration (`simultaneousHandlers`) to avoid deadlocks (Risk #4 in the plan). A Phase-2 day-2 spike validates this on Android. Manual QA row + Maestro flow guard against regressions.

## Verification

Maestro flow: open reader, swipe up on drawer to expand, swipe horizontally on the underlying pager — pager turns, drawer stays expanded. Swipe down on drawer — drawer closes, pager unaffected. No deadlock on Android emulator API 33 or Pixel 4a real device.
