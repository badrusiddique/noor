# ADR-0005: SQLite is the source of truth; Zustand stores are UI caches

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap

## Context

Noor has two storage layers: SQLite (corpus + user data: bookmarks, highlights, notes, history, audio cache) and Zustand stores (in-memory UI state, optionally persisted to MMKV for fast cold-start hydration). The risk pattern in apps like this is "two sources of truth": user toggles a bookmark, Zustand updates, SQLite write fails silently, app restarts, bookmark vanishes — or worse, comes back wrong.

Two architectural stances were available. (A) Treat Zustand as the source of truth and lazy-write to SQLite. Simple, fast, but failure modes look like silent data loss. (B) Treat SQLite as the source of truth, Zustand as a cache with optimistic updates and rollback on write failure. Slightly more code at the boundary, much stronger durability guarantees.

The plan also puts `sync_id TEXT UNIQUE` columns on every user-mutable row to keep the schema sync-ready post-MVP. That only works if SQLite is canonical.

## Decision

SQLite owns persisted user data. Zustand stores cache it for the UI. Reads hydrate from SQL on app start; writes go to SQL first (or optimistically to cache and then SQL with rollback on failure). Pure-UI ephemeral state (current page, drawer position, search query) lives only in Zustand. Settings (which has a small KV surface) is the one slice that persists fully via MMKV with no SQL backing — settings recovery from SQL is overkill.

## Alternatives considered

- **A: Zustand as source of truth, SQL as a snapshot.** Faster to write, weaker durability story, no clean path to sync. Rejected.
- **B: SQL canonical, Zustand cache (chosen).** Stronger durability, sync-ready, slightly more boilerplate at write sites.
- **C: WatermelonDB or a reactive ORM.** Reactive bindings between SQL and React. Massive dependency for a small benefit; conflicts with the manual Zustand slices we want for explicit control.

## Consequences

Positive: a force-quit mid-write loses at most one optimistic update; SQL is consistent on relaunch. Sync-readiness column (`sync_id`) is meaningful. Bookmarks/highlights/notes survive every QA resilience scenario in §7 of the plan.

Negative: write paths have two steps (cache + SQL). We pay for that with explicit rollback code in mutators, which doubles as a clear audit point.

## Verification

Maestro flow: bookmark Q2:255, immediately `adb shell am force-stop app.noor.quran`, relaunch — bookmark is present. The SQL row predates the next render. Same for note edits, highlights, history.
