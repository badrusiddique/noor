# ADR-0002: Expo Router over manual React Navigation

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap

## Context

Noor needs deep links (`noor://reader/<page>?v=<surah>:<ayah>`), modal routes (verse actions, scholar picker, note editor, share sheet), and a clean separation between top-level tabs and nested reader routes. Two navigation approaches were available in 2026's React Native ecosystem.

Plain `@react-navigation/native` requires hand-wiring every navigator, deep-link prefix config, and TypeScript route param maps. Expo Router v4 layers a file-based routing convention on top of the same React Navigation primitives — `app/index.tsx`, `app/(tabs)/_layout.tsx`, `app/reader/[page].tsx` become routes by their filenames, with typed route helpers and deep links generated automatically.

Either path can build the same app. The question is overhead: solo dev hours spent on routing scaffolding instead of the Mushaf renderer.

## Decision

Use Expo Router v4 file-based routing for all routes. Verse-action sheet, scholar picker, note editor, and share sheet are modal routes (`app/modals/...`) — deep-linkable and back-button-friendly. The translation drawer is **not** a route — it is a `BottomSheetModal` mounted inside the reader screen (drawers are sheets in our design, not navigation destinations).

## Alternatives considered

- **A: Manual React Navigation.** Maximum flexibility, full programmatic control. Costs hours of scaffolding and the resulting code looks like a slightly different version of what Expo Router generates.
- **B: Expo Router v4 (chosen).** File-based, deep-link friendly, typed routes via `experiments.typedRoutes`. The convention is well-documented and matches the plan's repo layout naturally.
- **C: A hybrid (Expo Router for the shell, manual nav for the reader).** No real benefit. Confusing for contributors.

## Consequences

Positive: routing config disappears into the file system. Deep links to `noor://reader/124?v=2:255` work without any Linking config beyond the URL scheme in `app.config.ts`. Modal routes are dismissed by the OS back gesture for free. Less code to maintain.

Negative: tied to Expo's release cadence for navigation features. The migration path off Expo Router (back to plain React Navigation) is non-trivial if we ever needed it — but we'd be migrating off Expo entirely at that point, which is a much bigger decision than this one.

## Verification

End-to-end Maestro flow: cold-start app, open `noor://reader/2?v=1:1` deep link, expect to land on Surah Al-Baqarah's first page with the verse-action sheet for Q1:1 not present (because deep link does not auto-open modals — design intent). All modals dismiss with hardware back button on Android.
