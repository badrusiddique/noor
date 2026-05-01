# ADR-0001: Single-app repo, not monorepo

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap

## Context

Noor is a single mobile app — one Expo + React Native target compiling to iOS and Android. There is no web companion in the v1.0 scope, and no second app planned through v1.1. A monorepo (pnpm workspaces, Nx, Turborepo) would buy nothing today: there is one `package.json`, one TypeScript config, one CI pipeline.

Two layouts were available. **Option A:** `apps/mobile/` with the Expo project nested, leaving room for `apps/web/`, `packages/shared/` later. **Option B:** Expo project at the repo root with no extra indirection. Option A's cost is real for a solo developer: every command becomes `pnpm --filter mobile <cmd>`, every path becomes `apps/mobile/src/...`, and the CI workflow needs working-directory plumbing.

The plan's directory tree showed Option A by default; the user's stated intent — "single-app, no monorepo overhead" — points at Option B.

## Decision

Place the Expo app at the repository root. No `apps/mobile/` indirection. If a web companion arrives in v1.2 (Expo supports web; decision deferred until Android traction is real), restructure to a workspace at that point — `git mv` is cheap, ADR-0001 gets superseded.

## Alternatives considered

- **A: pnpm workspace with `apps/mobile/` + future `packages/shared/`.** Future-proof for a multi-app world that does not exist. Adds workspace plumbing, longer paths, and more friction to every command for a year before it pays off — if it ever does.
- **B: Single-app root layout (chosen).** Zero workspace overhead. Migration to a workspace later is a `git mv` + `package.json` reshuffle that takes an afternoon, with full git history preserved.
- **C: Nx / Turborepo.** Same shape as A with a heavier task runner. Massive overkill for one app.

## Consequences

Positive: simpler scripts, simpler CI, simpler docs, simpler mental model. New contributors clone and `pnpm install` at the root and everything works. Tooling like `expo-doctor`, `eas`, and `metro` find their config without env-var gymnastics.

Negative: if web/PWA ships in v1.2 and we want a `packages/shared/` for ports of `src/data/queries/*`, we will have to migrate. The cost is bounded — file moves and a pnpm-workspace YAML — and is easier when there is a concrete second app rather than speculative space.

## Verification

A new contributor can clone `github.com/badrusiddique/noor`, run `pnpm install && pnpm start`, and have Expo Go running within 5 minutes with zero workspace-related errors. CI workflow has no `working-directory:` indirection.
