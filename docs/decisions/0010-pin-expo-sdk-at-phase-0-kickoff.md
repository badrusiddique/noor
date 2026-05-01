# ADR-0010: Pin Expo SDK + RN at Phase 0 kickoff (don't pre-pin)

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap

## Context

Expo cuts a new SDK roughly every 6 months. React Native ships a new minor every 3-ish months. The plan was written before Phase 0 kickoff; if it had locked an SDK version, that version would already be one or two cycles stale by the time real coding begins.

Two approaches: (A) pre-pin specific versions in the plan, knowing they will be outdated — but at least every reader of the plan sees the same numbers. (B) leave the plan version-agnostic and pin in this ADR + `package.json` at the moment the bootstrap happens.

Option B is correct in principle but loses fidelity if not actively maintained. The fix: the bootstrap files (`package.json`, `app.config.ts`) carry the actually-pinned versions, and this ADR is updated with the locked numbers when the bootstrap completes.

## Decision

Pin to the latest stable Expo SDK and React Native at Phase 0 kickoff. Capture the pinned versions in `package.json` and reference them here. Subsequent SDK upgrades (bi-annual) get their own ADRs documenting what changed and what regressed.

Phase 0 pinned versions (initial bootstrap):

- **Expo SDK:** 52
- **React Native:** 0.76.x
- **TypeScript:** 5.6.x
- **Node (runtime for tooling):** 20.x

The new architecture (Fabric + TurboModules) is **enabled** (`newArchEnabled: true` in `app.config.ts`).

## Alternatives considered

- **A: Pre-pin in the plan.** Stale by the time anyone implements.
- **B: Pin at Phase 0 kickoff (chosen).** Fresh versions, captured in `package.json` + this ADR.
- **C: Always-latest, no pinning.** Build reproducibility falls apart. Rejected.

## Consequences

Positive: Phase 0 starts on a current toolchain. Build-time and runtime risk is the lowest it can be at moment of kickoff. New-arch is on, so we don't accumulate old-arch tech debt.

Negative: this ADR must be updated when the SDK is bumped (every ~6 months). Bi-annual SDK upgrades take a focused day; Expo's upgrade tool covers most of it. We accept this as the natural tax of being on Expo.

## Verification

`pnpm install` succeeds. `pnpm doctor` (`expo-doctor`) passes. The empty Phase 0 app builds in EAS preview profile and runs in Expo Go on a real iPhone and a real Pixel.
