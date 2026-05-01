# ADR-0008: `react-native-track-player` not `expo-av`

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap

## Context

Noor plays Quranic recitation. Users will play surahs while driving (CarPlay / Android Auto), while exercising (Bluetooth headset), while their phone is locked. They expect proper lock-screen controls, Now Playing on iOS, MediaSession on Android, remote events from headphones, and uninterrupted background playback.

`expo-av` is Expo's first-party audio module. It plays audio fine but its lock-screen / MediaSession integration has historically been thin, and in 2026 it is on Expo's "legacy" track — Expo recommends the new `expo-audio` module for new development, but `expo-audio` is also less feature-rich than `react-native-track-player` for exactly the lock-screen + remote-events case.

`react-native-track-player` runs as a foreground service on Android, integrates with `MPNowPlayingInfoCenter` on iOS, supports CarPlay / Android Auto remote events for free, and has a rate API for the playback-speed setting hifz users want (0.75 / 1 / 1.25 / 1.5 / 2×).

The previous revision of this plan picked `expo-av`; the reviewer flipped to `react-native-track-player`.

## Decision

Use `react-native-track-player` for all audio. `expo-av` not installed. The audio architecture is a single playback queue (ayah = track), with multi-CDN URL resolution before each track (`base_urls[]` array per reciter, ordered preference).

Hifz workflows ("play to end of page", "repeat ayah N times", playback speed) are handled by enqueueing the right track set + listening to `Event.PlaybackQueueEnded` and `Event.PlaybackTrackChanged`.

## Alternatives considered

- **A: `expo-av`.** First-party, easier `pnpm dlx expo install`. Lock-screen story is thin; legacy track in 2026.
- **B: `expo-audio` (the new Expo-recommended module).** First-party, on the modern track. Lock-screen / remote-events integration is less mature than `react-native-track-player`. Worth re-evaluating in v1.1.
- **C: `react-native-track-player` (chosen).** Lock-screen / CarPlay / remote events all work. Mature, well-maintained.

## Consequences

Positive: a user listening to Surah Yasin in their car gets proper Now Playing display, can skip with the steering wheel button, and the audio survives the screen locking. Bluetooth headset play/pause works. Lock-screen artwork shows correctly.

Negative: an extra native module to configure in `app.config.ts` and to keep up to date with new arch. The `Service` setup is RN-specific boilerplate (one service registration in the entry file). Initial setup is a few hours; the alternative is a category of bugs we never want to chase.

## Verification

Phase 7 manual QA: full Surah Al-Fatihah Alafasy plays. Lock the screen mid-Q1:3 — audio continues, lock-screen shows reciter + ayah + play/pause. Connect Bluetooth headset, press the headset's pause button — audio pauses; press again — resumes. CarPlay simulator (or Android Auto DHU) shows the now-playing card.
