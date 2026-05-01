# ADR-0011: Android first launch; iOS App Store deferred

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap (operational)

## Context

Noor ships from a single Expo + React Native codebase to both iOS and Android — the technical capability to launch on both stores at once already exists. The question is operational: when do we pay each store's fee, and which store does the public launch happen on first?

- **Google Play Store:** $25 one-time developer registration fee. Submission review is hours-to-days. APK and AAB distribution.
- **Apple App Store:** $99/year Apple Developer Program. Submission review is typically 1 week first time. TestFlight requires the same paid program. Sideloading is not a viable distribution path on iOS at scale.
- **Free paths during development on iOS:** Expo Go (scan QR, runs JS bundle on the user's device) and EAS internal/preview builds installable via expo.dev URL. Both work without paying Apple anything.

Project goals are explicit on cost: zero hosting cost, zero recurring spend, prefer free distribution paths. Apple's $99/yr is not zero. Until the app has demonstrated real user demand, paying Apple yearly is speculative spend.

## Decision

**Public launch is Android-only.** v1.0.0 ships exclusively to Google Play Store production track + APK on `github.com/badrusiddique/noor/releases`. The $25 one-time Play fee is paid at Phase 9 (MVP). The Apple Developer Program fee is **not** paid and the App Store submission **does not happen** in the v1.0.0 launch window.

Early iOS users still have a free path: Expo Go QR distribution (developer scans QR from `expo start --tunnel`) and EAS preview builds installable via `expo.dev` URL with a personal device UDID enrollment in a free developer team (no paid program required for ad-hoc internal distribution).

The decision to enroll in the Apple Developer Program is **revisited only after** v1.0.0 has shipped on Android and produced a measurable user signal — installs in the thousands, organic search traffic, repeat-use cohorts. Without that signal, $99/yr is a tax on hope.

## Alternatives considered

- **A: Launch on both stores at v1.0.0.** Pay $25 + $99 simultaneously. Pros: parity from day one; iOS users not asked to install Expo Go. Cons: $99/yr commitment forever; first-submission App Store review can stall the launch; can't validate the no-pay path first.
- **B: Launch iOS first.** Common assumption that iOS users pay more / engage more. Cons: $99/yr commitment up front; no zero-cost validation lane; Apple review is the longest critical path.
- **C: Android first, iOS later (chosen).** Ships the product to a real audience for the cost of $25. iOS users get Expo Go + EAS preview as the free path until traction justifies the App Store. Asymmetric: doesn't penalize iOS users (they can still use the app), just doesn't list it on the App Store yet.
- **D: PWA only.** Avoids both store fees but requires rewriting parts of the app for browser constraints (audio session, persistent storage quotas, gesture handling), and Safari iOS PWA limitations are real. Conflicts with the locked tech stack.

## Consequences

Positive:

- v1.0.0 ships with $25 total spend.
- No annual $99 obligation locks us into Apple's release cadence.
- Apple's first-submission review is not on the v1.0.0 critical path.
- Android launch validates the product in the world's largest mobile market by units (especially relevant for the South Asian audience: Pakistan / India / Bangladesh skew Android-heavy).
- Decision is reversible — paying Apple later is always an option.

Negative:

- iOS users without Expo Go have no path to install the app until we enroll in the Developer Program.
- We can't run native iOS automated E2E in CI (which we already deferred — see `.github/workflows/e2e.yml`).
- Some early-adopter feedback skews Android because that's the only public install path.
- Marketing of "available on both iOS and Android" is technically true but practically asymmetric until Apple enrollment.

## Verification

This ADR is satisfied when:

1. Phase 9 deliverables include Play Store production submission, GitHub Release with signed APK + AAB, and **explicitly do not include** any TestFlight or App Store Connect activity.
2. The public launch announcement copy says "Android first; iOS coming based on demand" or equivalent — does not promise iOS at launch.
3. Apple Developer Program enrollment, if it happens, gets its own follow-up ADR with the traction data that justified the spend.
