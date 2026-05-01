# Backend Honesty

The user said "no backend." This document is the brutally honest accounting of every external dependency Noor touches over the network, who runs it, and whether the app can function without it.

The headline:

> **Net runtime backends from the user's device: zero — except optional audio CDN (the user can stick to bundled Al-Fatihah and never touch it) and optional Sentry (default off). No accounts, no databases-of-record, no APIs we operate. No costs to us. Ever.**

---

## Every Network Touchpoint

| Service | Purpose | Required to use the app? | Where it runs |
|---|---|---|---|
| **Everyayah.com** | Audio CDN (primary) | No — bundled Al-Fatihah works offline; user can use full app without audio | External, free, public |
| **download.quranicaudio.com** | Audio CDN (fallback) | No — only used if Everyayah unavailable | External, free, public |
| **Sentry** | Crash reports | No — opt-in; default OFF; local crash log is the default | External, opt-in only |
| **Tanzil.net + QuranEnc** | Source XML/JSON | **Build-time only** — never contacted by the app at runtime | External, build-machine only |
| **api.quran.com (mushaf cross-check)** | Page-map validation | **Build-time only** — never contacted by the app at runtime | External, build-machine only |
| **fonts.qurancomplex.gov.sa** | KFGQPC font download | **Build-time only** | External, build-machine only |
| **EAS Build** | Compiles release binaries | Build-time only — never runs on user devices | Expo's servers, only at tag time |
| **GitHub Actions** | CI | Build-time only | GitHub's servers |
| **GitHub Releases** | Distribute APK | One-time download per user | GitHub's CDN |

---

## What This Means in Practice

- A user who installs the app, never plays audio beyond Al-Fatihah, and leaves crash reporting off (the default) makes **zero outbound network calls** from their device for the lifetime of the app.
- A user who plays audio for other surahs streams from Everyayah (free, public) or its fallback. The audio cache LRU keeps frequently-played files local.
- A user who opts into crash reporting sends Sentry events on errors only — heavily redacted (no verse text, no user IDs ever via `Sentry.setUser`).

There is **no telemetry**. No "ping home" on launch. No A/B testing infrastructure. No advertising IDs. No analytics SDKs.

---

## What We Do NOT Operate

- **No database.** Your bookmarks, highlights, notes, and history live in your phone's SQLite file. We can't see them. We never receive them.
- **No accounts.** No login, no signup, no email collection.
- **No sync server.** The schema has `sync_id` columns to keep cloud-sync as a future option, but no sync runs in v1.0.
- **No API.** The app does not call any service we run, because we do not run any service.
- **No CDN we pay for.** Audio comes from third-party free public CDNs.

The only money we spend is the one-time $25 Google Play Console fee. The Apple Developer Program ($99/yr) is deferred indefinitely until Android traction justifies it.

---

## Risks We Accept

- **Everyayah.com could go down.** Multi-CDN fallback to `download.quranicaudio.com` is the mitigation; if both are down, audio fails gracefully and the rest of the app works.
- **Tanzil / QuranEnc could change their license terms.** Source XML is checksum-pinned in `data/sources.json` — we always know which version we shipped.
- **GitHub Releases could rate-limit downloads.** If this becomes real, the APK can be mirrored elsewhere.

These are accepted risks because the alternative — running our own infrastructure — costs money and breaks the no-backend promise.
