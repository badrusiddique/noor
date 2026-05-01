# Noor

> A South Asian Quran reader for iOS and Android. Privacy-first. No ads, no login, no analytics, no tracking. Ever.

[![Build Status](https://github.com/badrusiddique/noor/actions/workflows/ci.yml/badge.svg)](https://github.com/badrusiddique/noor/actions/workflows/ci.yml)
[![Supply Chain](https://github.com/badrusiddique/noor/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/badrusiddique/noor/actions/workflows/supply-chain.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Privacy: ★★★★★](https://img.shields.io/badge/Privacy-%E2%98%85%E2%98%85%E2%98%85%E2%98%85%E2%98%85-1f6b6b)](docs/BACKEND-HONESTY.md)

Noor is a faithful, page-perfect digital Mushaf for South Asian readers, built with Expo and React Native. The 15-line IndoPak page layout is preserved exactly — page numbers, juz markers, and ruku marks match the printed Mushaf so hafiz reference points still work. Three Urdu/English translations ship in v1.0: Kanzul Iman (Ahmad Raza Khan), Tafhim-ul-Quran (Maududi), and Saheeh International. Audio plays from public CDNs with a multi-CDN fallback and a fully-offline bundled Surah Al-Fatihah for first-run users.

The app runs entirely on-device. No accounts, no backend, no telemetry. Bookmarks, highlights, notes, and history live in your phone's SQLite file — we never see them, because there is nothing to see them with.

---

## Why Noor

Most Quran apps have one of these problems:

- They've been caught selling user location data (Muslim Pro / X-Mode, 2020 — still a live App Store review thread).
- They reflow the Mushaf when you change font size, breaking page references and juz markers.
- They use Madani fonts that don't match the IndoPak Mushaf South Asian readers learned with.
- They require an account, push notifications, and bury the offline mode behind a paywall.

Noor solves the South Asian reader's actual problems and refuses to do the things they don't want.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Expo SDK 52 |
| Framework | React Native 0.76 (new architecture: Fabric + TurboModules) |
| Language | TypeScript 5.6 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| Routing | `expo-router` v4 (file-based, deep-link friendly) |
| State | `zustand` v5 + `react-native-mmkv` v3 (KV cache) |
| Database | `@op-engineering/op-sqlite` (primary, FTS5), `expo-sqlite` (fallback) |
| Bottom sheets | `@gorhom/bottom-sheet` v5 |
| Page turn | `react-native-pager-view` (native ViewPager2 / UIPageViewController) |
| Animation | `react-native-reanimated` v3 + `react-native-gesture-handler` v2 |
| Long lists | `@shopify/flash-list` |
| SVG | `react-native-svg` |
| Audio | `react-native-track-player` (lock-screen, CarPlay, Bluetooth remote events) |
| i18n | `i18n-js` + `expo-localization` |
| Crash log | `react-native-exception-handler` (local default) + `@sentry/react-native` (opt-in) |
| Test (unit) | `jest` + `jest-expo` + `@testing-library/react-native` |
| Test (E2E) | `maestro` |
| Test (a11y) | `@axe-core/react-native` |
| Lint/format | `eslint` v9 flat config + `prettier` v3 |
| Quality | `knip`, `madge --circular`, `size-limit` |

Full ADRs in [`docs/decisions/`](docs/decisions/).

---

## Quickstart

### Prerequisites

- Node 20+ (`nvm install 20 && nvm use 20`).
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.14.4 --activate`).
- Xcode 15+ (iOS) or Android Studio (Android emulator).
- Expo Go app on your phone for fastest dev iteration.

### Install

```sh
git clone https://github.com/badrusiddique/noor.git
cd noor
pnpm install
chmod +x .husky/*    # one-time: husky hook scripts need exec bit
```

### Run

```sh
pnpm start            # Expo dev server, scan QR with Expo Go
pnpm ios              # iOS simulator
pnpm android          # Android emulator
```

### Common scripts

```sh
pnpm typecheck        # TypeScript strict-mode check
pnpm lint             # ESLint
pnpm format           # Prettier write
pnpm test             # Jest
pnpm test:coverage    # Jest with coverage
pnpm db:build         # Phase 1+: build assets/db/quran.db from Tanzil + QuranEnc
pnpm db:verify        # Phase 1+: golden-page checksum + FTS5 sanity
pnpm audio:bundle     # Phase 1+: download + verify bundled Al-Fatihah Alafasy
pnpm doctor           # expo-doctor — environment sanity
pnpm size             # bundle-size budget check (5% PR gate)
pnpm madge            # circular import detection
pnpm knip             # dead-code detection
```

---

## 14-Week Phased Roadmap

The plan is shipped in 10 small, individually-tagged releases. Each tag is gated by the brutal QA matrix in [`docs/QA-MATRIX.md`](docs/QA-MATRIX.md) — a single failed Stop-Ship row blocks the tag.

| Phase | Weeks | Tag | Deliverable |
|---|---|---|---|
| 0 — Bootstrap | 1 | `v0.1.0-bootstrap` | This repo. CI green on empty PR. ADRs 0001–0010. |
| 1 — Data pipeline | 2 | `v0.2.0-data` | Tanzil + QuranEnc → SQLite + FTS5; KFGQPC bundled; render-and-assert on all 604 pages. |
| 2 — Mushaf reader v1 | 3–6 | `v0.3.0-mushaf-alpha` | 15-line page renderer, parchment + OLED night themes, font-size slider clamped. **First user release (APK).** |
| 3 — Navigation + Home + Surah index | 7 | `v0.4.0-nav` | Bottom tabs, Resume card, Surah index, last-read persistence, Urdu UI strings live. |
| 4 — Verse sheet + bookmarks + highlights + history + notes + share | 8–9 | `v0.5.0-marks` | Long-press action sheet, optimistic SQL writes, deep-link share to WhatsApp. |
| 5 — Translation drawer | 10 | `v0.6.0-translate` | Bottom sheet drawer (38px peek / 38% expanded), 3 translations live. |
| 6 — Search | 11 | `v0.7.0-search` | FTS5 across Arabic + 3 translations + transliteration, diacritic-insensitive. |
| 7 — Audio | 12–13 | `v0.8.0-audio` | track-player, multi-CDN fallback, 3 reciters, lock-screen controls, hifz workflows. |
| 8a — Settings + Onboarding + polish | 14a | (intermediate) | Theme switcher, font sliders, privacy positioning copy, Send Diagnostics. |
| 8b — Qibla | 14b | `v0.9.0-rc` | Magnetometer compass, calibration UI. |
| 9 — Hardening + MVP launch | 15–16 | `v1.0.0` | Full QA matrix sweep, Sentry crash sweep, store listing, Play Store production. |

Stop-ship rule: **Mushaf reader is end-to-end working before Phase 3 starts**. No parallel feature work.

---

## Architecture Decision Records

Every locked decision in the plan has an ADR. Read these before changing core architecture.

- [ADR-0001 — Single-app repo, not monorepo](docs/decisions/0001-single-app-repo-not-monorepo.md)
- [ADR-0002 — Expo Router over React Navigation](docs/decisions/0002-expo-router-over-react-navigation.md)
- [ADR-0003 — `op-sqlite` primary, `expo-sqlite` fallback](docs/decisions/0003-op-sqlite-primary-expo-sqlite-fallback.md)
- [ADR-0004 — 15-line invariant: Mushaf font-size is clamped, never reflows](docs/decisions/0004-mushaf-fontsize-clamped-never-reflows.md)
- [ADR-0005 — SQLite is the source of truth; Zustand is a UI cache](docs/decisions/0005-sqlite-source-of-truth-zustand-cache.md)
- [ADR-0006 — Per-component RTL, never `I18nManager.forceRTL`](docs/decisions/0006-per-component-rtl-no-forcertl.md)
- [ADR-0007 — `@gorhom/bottom-sheet` v5](docs/decisions/0007-gorhom-bottom-sheet-v5.md)
- [ADR-0008 — `react-native-track-player` not `expo-av`](docs/decisions/0008-react-native-track-player-not-expo-av.md)
- [ADR-0009 — KFGQPC IndoPak primary, Scheherazade New fallback](docs/decisions/0009-kfgqpc-indopak-with-scheherazade-fallback.md)
- [ADR-0010 — Pin Expo SDK + RN at Phase 0 kickoff](docs/decisions/0010-pin-expo-sdk-at-phase-0-kickoff.md)

---

## Privacy Positioning

The strongest organic-acquisition lever in the Quran-app category is **explicit privacy positioning**, because the bar set by competitors is so low.

- **No ads.** Not "limited ads" or "respectful ads" — none.
- **No login.** No accounts, no email collection, no signup screen anywhere.
- **No analytics.** Zero analytics SDKs. `pnpm why posthog mixpanel firebase amplitude` returns "not found" — and that's a CI test.
- **No tracking.** No advertising IDs, no fingerprinting, no third-party identity stitching.
- **Your bookmarks stay on your device.** SQLite file in your phone's app sandbox. We can't see it because there is no "we" running a server.

The optional surfaces — audio CDN, Sentry crash reports — are listed honestly in [`docs/BACKEND-HONESTY.md`](docs/BACKEND-HONESTY.md). Sentry defaults to OFF. Audio defaults to "stream from public CDN" but works fully offline once you've played a verse.

The Muslim Pro / X-Mode / US-military scandal is still in App Store reviews five years later. Being aggressively, verifiably, the opposite of that is the brand.

---

## QA — Brutal, Ruthless, Evidence Before Claims

Every tag is gated on [`docs/QA-MATRIX.md`](docs/QA-MATRIX.md). The matrix has six categories — Functional, Performance, Accessibility, Resilience, Privacy, Security — and a device matrix that includes a Pixel 4a as the "if it's smooth here, it's smooth everywhere" floor.

For `v1.0.0`: every row, every device, every OS version. Plan a full day for the sweep.

---

## Distribution

| Phase | iOS | Android | Cost |
|---|---|---|---|
| 0–2 | Expo Go (`expo start --tunnel` QR) | Expo Go | $0 |
| 3–7 | Expo Go + EAS preview | EAS preview APK, sideload | $0 |
| 8 RC | Expo Go (TestFlight = $99/yr, deferred) | Play Console internal track ($25 one-time) | $0 (Apple deferred) |
| 9 MVP | App Store ($99/yr — deferred indefinitely) | Play Store production | **$25** |

Android-first launch. iOS deferred until Android traction justifies the $99/yr.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Conventional commits enforced by commitlint. Signed commits required from `v1.0.0` onward.

After installing dependencies, **run `chmod +x .husky/*` once** so the commit-msg and pre-commit hooks are executable.

## Code of Conduct

[Contributor Covenant v2.1](CODE_OF_CONDUCT.md). Conduct concerns: `badru.siddique@hudl.com`.

## Security

[SECURITY.md](SECURITY.md) — disclosure policy, scope, and contact.

## License & Attribution

Source code is [MIT](LICENSE), copyright 2026 Badrudduza Siddique.

Quran text, translations, fonts, and audio recitations are third-party works under their respective licenses. Full attribution: [docs/THIRD_PARTY_NOTICES.md](docs/THIRD_PARTY_NOTICES.md).

---

## Repo

[`github.com/badrusiddique/noor`](https://github.com/badrusiddique/noor) — public, MIT, accepting issues and PRs.
