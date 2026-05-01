# ADR-0003: `op-sqlite` primary, `expo-sqlite` fallback — day-1 spike validates

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap (validation in Phase 1)

## Context

Noor is SQLite-shaped: ~6,236 verses, ~77,430 words, 3× translation tables, FTS5 full-text search, and user-mutable tables for bookmarks/highlights/notes/history. Two SQLite bindings are mainstream in React Native in 2026: `expo-sqlite` (Expo's first-party module) and `@op-engineering/op-sqlite` (a community JSI-based binding).

`expo-sqlite` v15+ added a synchronous JSI API and now compiles FTS5 by default — but several historical Expo SDK builds shipped without FTS5, and the new-arch story has been bumpy. `op-sqlite` always compiles FTS5 in, has a faster JSI sync API, and integrates cleanly with the new architecture (Fabric/TurboModules). The cost is leaving Expo's first-party world for one critical dependency.

A day-1 spike on iOS device + iOS simulator + Android device + Android emulator (4 results) determines which works. The previous revision of this plan picked `expo-sqlite` first; the reviewer flipped to `op-sqlite` based on FTS5 reliability and the JSI ergonomics.

## Decision

Pick `@op-engineering/op-sqlite` as the primary binding. `expo-sqlite` stays as a documented fallback. The data layer (`src/data/db/client.ts`) abstracts both behind one interface so the swap is a one-file change.

A Phase 1 spike runs queries `(SELECT 1)`, `CREATE VIRTUAL TABLE ... USING fts5`, and `MATCH 'rahman'` on all four targets. If `op-sqlite` fails any environment, fall back to `expo-sqlite`; if it fails too, document the path forward.

## Alternatives considered

- **A: `expo-sqlite` only.** First-party. FTS5 compiled by default in current SDK. Risks: previous reliability issues, some new-arch edge cases, slower in benchmarks.
- **B: `@op-engineering/op-sqlite` (chosen primary).** Faster JSI sync API, FTS5 always compiled, mature on new-arch. Risks: leaves first-party Expo. Maintainer is a single engineering shop.
- **C: WatermelonDB.** Reactive layer on top of SQLite. Massive overkill for an offline-only app with no sync; conflicts with our "SQLite is the source of truth, Zustand is a UI cache" design.

## Consequences

Positive: predictable FTS5, faster reads, JSI sync API simplifies Mushaf hot-path queries. The spike de-risks the choice before any feature code is written.

Negative: one fewer first-party Expo module. If `op-sqlite` is abandoned, we have to switch — which is exactly why the data layer is abstracted behind `client.ts` from day one.

## Verification

Phase 1 day-1 spike: same `client.ts` API on `op-sqlite` and `expo-sqlite`, exercised on all four target environments. CI also runs the data-layer unit tests against both bindings to keep the abstraction honest. Page query for page 100 returns under 20ms p95 on Pixel 4a.
