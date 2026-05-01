# QA Matrix — Noor

This matrix is the gate before any tag. Any **Stop-Ship** row that fails → no tag.

Phases 0–8 each pull a subset; **Phase 9 (`v1.0.0`) runs every row on every device** — plan a full day for the matrix sweep.

---

## Device Matrix (minimum)

| Device                     | OS                           | Why                                                               |
| -------------------------- | ---------------------------- | ----------------------------------------------------------------- |
| iPhone SE 2020             | iOS 16 / 17 / 18             | Smallest current iOS screen, lowest CPU floor                     |
| iPhone 15                  | iOS 18                       | Dynamic Island, modern flagship                                   |
| Pixel 4a                   | Android 13 (max upgradeable) | 2 GB RAM perf floor — if it's smooth here, it's smooth everywhere |
| Pixel 8                    | Android 14 / 15              | Modern flagship, latest Android                                   |
| Samsung A-series mid-range | Android 12 / 14              | OneUI quirks (Samsung's Android skin)                             |
| iPad mini (6th gen)        | iPadOS 17 / 18               | Tablet sanity — no full tablet UI in v1, but no crashes           |

Don't own them all? **BrowserStack App Live free trial** + local Android emulators (`avdmanager create avd ...`) + iOS Simulator cover most of the matrix.

## OS Version Matrix

- **iOS:** 16 (min), 17, 18 (max) — test min and max of each major.
- **Android:** 10 (min), 12, 14, 15 (max).

---

## 1. Functional

| Test                                         | Repro Steps                              | Pass Criteria                                                                      | Stop-Ship | Phase |
| -------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- | --------- | ----- |
| Cold start lands on Resume card              | Force-quit app, relaunch                 | Resume card visible <1s, last_read row populated                                   | Y         | 3+    |
| Mushaf page renders 15 lines                 | Open page 1, count lines                 | Exactly 15 lines, all visible, no clipping                                         | Y         | 2     |
| Surah cartouche renders on Surah-start pages | Open page 1, 22, 50                      | Cartouche shown above first ayah, surah name + ayah count correct                  | Y         | 2     |
| Page-turn forward/back                       | Swipe right-to-left on RTL pager         | Page advances by 1, no skip, no double-turn                                        | Y         | 2     |
| Last-read persistence                        | Read to page 100, force-quit, relaunch   | Opens at page 100                                                                  | Y         | 3     |
| Surah index → page jump                      | Tap "Al-Baqarah" in Surahs tab           | Lands on page 2 (first page of Al-Baqarah)                                         | Y         | 3     |
| Bookmark Q2:255                              | Long-press Q2:255 → Bookmark             | Row in Bookmarks tab, persists across kill+relaunch                                | Y         | 4     |
| Highlight 4 colors                           | Long-press → Highlight → pick color      | Color persists, all 4 colors visually distinct                                     | Y         | 4     |
| Note creation + edit                         | Long-press → Note → type → save → reopen | Note text round-trips, edit saves                                                  | Y         | 4     |
| Copy verse text                              | Long-press → Copy                        | Clipboard has Arabic + active translation + reference                              | Y         | 4     |
| Share → WhatsApp                             | Long-press → Share → WhatsApp            | Recipient sees Arabic + translation + `noor://` deep link, no rendering corruption | Y         | 4     |
| Translation drawer 3 states                  | Reader → drag drawer                     | Closed, peek (38px), expanded (38%) snap correctly                                 | Y         | 5     |
| Switch translation                           | Drawer → Change → pick scholar           | Drawer re-renders with new translation, no flicker                                 | Y         | 5     |
| Search "alhamd"                              | Search tab → type "alhamd"               | Q1:2 in top results <200ms p95                                                     | Y         | 6     |
| Search Arabic "الرحمن"                       | Search tab → paste Arabic                | Surah Ar-Rahman top hit                                                            | Y         | 6     |
| Diacritic-insensitive search                 | Search "rahman" then "raḥmān"            | Same result set                                                                    | Y         | 6     |
| Audio play Q1                                | Audio tab → Surah 1 → Play               | All 7 ayahs play in order, lock-screen shows Now Playing                           | Y         | 7     |
| Audio "play to end of page"                  | Reader → Play page                       | Plays all ayahs on page, stops at page boundary                                    | Y         | 7     |
| Audio repeat-N                               | Settings → repeat 3 → play ayah          | Ayah loops 3× then advances                                                        | Y         | 7     |
| Qibla compass                                | Qibla tab → grant magnetometer           | Within 5° of known compass app on 3 devices                                        | Y         | 8b    |
| UI Urdu toggle                               | Settings → Language → Urdu               | All UI strings translate, no missing keys, no truncation                           | Y         | 3+    |

---

## 2. Performance

| Test                       | Repro Steps                 | Pass Criteria                     | Stop-Ship | Phase |
| -------------------------- | --------------------------- | --------------------------------- | --------- | ----- |
| Cold start to Resume card  | Kill app, relaunch, time    | <1000 ms p95 on Pixel 4a          | Y         | All   |
| Page-turn frame time       | Swipe 10 pages in burst     | ≥58 fps median, p99 <16.6 ms      | Y         | 2+    |
| Page-turn no jank          | Same                        | No drops >50 ms                   | Y         | 2+    |
| SQLite single-page query   | DB profiler                 | <20 ms p95                        | Y         | 1+    |
| FTS5 search                | Type "alhamd"               | <150 ms p95                       | Y         | 6+    |
| JS heap                    | Read 50 pages, profile      | <120 MB on 2 GB Android           | Y         | All   |
| No monotonic memory growth | Profile over 30-min session | Heap returns to baseline after GC | Y         | All   |
| DB size                    | `ls -la assets/db/quran.db` | <30 MB                            | Y         | 1+    |
| APK size                   | EAS build output            | <50 MB                            | Y         | All   |
| Audio first-byte → play    | Wi-Fi, Q1:1                 | <600 ms                           | Y         | 7+    |

---

## 3. Accessibility

| Test                               | Repro Steps                                                | Pass Criteria                                           | Stop-Ship | Phase |
| ---------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- | --------- | ----- |
| VoiceOver / TalkBack reads page    | Enable, focus Mushaf page                                  | Reads surah name, juz, page number, then ayahs in order | Y         | 8a+   |
| Dynamic Type doesn't clip          | iOS Settings → Larger Text → max                           | UI strings reflow, no clipping in chrome                | Y         | 8a+   |
| Contrast WCAG AA                   | Theme toggle, both themes                                  | All text ≥4.5:1 (or 3:1 for large)                      | Y         | 8a+   |
| Reduced-motion                     | OS Settings → Reduce Motion                                | Page-turn animation honored (cross-fade not slide)      | Y         | 8a+   |
| Bold-text honored                  | OS Settings → Bold Text                                    | UI strings render in bold                               | N         | 8a+   |
| High-contrast honored              | OS Settings → Increase Contrast                            | Borders thicker, icons stronger                         | N         | 8a+   |
| Screen reader navigates unaided    | TalkBack + Maestro flow: Home → Surahs → page 1 → bookmark | All steps reachable, no inaccessible elements           | Y         | 8a+   |
| Automated `@axe-core/react-native` | CI test                                                    | Zero violations                                         | Y         | All   |

---

## 4. Resilience

| Test                              | Repro Steps                                            | Pass Criteria                                                         | Stop-Ship | Phase |
| --------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- | --------- | ----- |
| Force-quit mid-page               | `adb shell am force-stop`, relaunch                    | Opens at last page, no data loss                                      | Y         | 3+    |
| Airplane-mode toggle              | Toggle while reading                                   | No crash, no UI freeze                                                | Y         | All   |
| Airplane-mode mid-audio           | Toggle during audio playback                           | Graceful failure, "audio offline" pill, can retry                     | Y         | 7+    |
| Disk-pressure                     | Fill device to <500 MB free                            | Audio cache LRU evicts, no crash                                      | Y         | 7+    |
| Low-memory                        | `adb shell am send-trim-memory <pkg> RUNNING_CRITICAL` | App reduces caches, doesn't crash                                     | Y         | All   |
| App-update migration              | Install old APK, install new                           | Bookmarks/highlights/notes survive                                    | Y         | 4+    |
| Backup/restore round-trip         | Android: Settings → Backup → factory reset → restore   | App restores with user data intact (best-effort; SQL via Auto Backup) | N         | 4+    |
| Permissions: notifications denied | Deny on prompt                                         | Graceful "tap to enable" pill                                         | Y         | 7+    |
| Permissions: magnetometer denied  | Deny on prompt                                         | Qibla shows "tap to enable" pill                                      | Y         | 8b    |
| Low battery (<20%)                | Trigger battery saver                                  | App still works, animations may degrade                               | N         | All   |
| Slow network (Charles 3G)         | Throttle, play audio                                   | Audio buffers, no crash, recovers                                     | Y         | 7+    |
| Backgrounded 1 hr                 | Switch to other app for 1 hr, return                   | App resumes at exact state                                            | Y         | All   |

---

## 5. Privacy

| Test                             | Repro Steps                                    | Pass Criteria                                                                     | Stop-Ship | Phase |
| -------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- | --------- | ----- |
| Charles Proxy network audit      | Capture full session                           | Only `everyayah.com`, `download.quranicaudio.com` (and `*.sentry.io` if opted in) | Y         | All   |
| Anything else in network capture | Same                                           | **Zero** other domains contacted                                                  | Y         | All   |
| `adb logcat` log scan            | Run app, filter for surah/ayah/verse text      | No verse text in logs                                                             | Y         | All   |
| Sentry redaction                 | Trigger crash with verse loaded, opt-in Sentry | Sentry event has no verse text in breadcrumbs/extra                               | Y         | 8a+   |
| Crash-report toggle off          | Settings → toggle off → trigger crash          | No event sent (Charles confirms)                                                  | Y         | 8a+   |
| Zero analytics SDKs              | `pnpm why posthog mixpanel firebase amplitude` | All return "not found"                                                            | Y         | All   |
| Play Store Data Safety review    | Pre-submission                                 | Questionnaire matches reality (no data collected)                                 | Y         | 9     |

---

## 6. Security

| Test                       | Repro Steps                                                                | Pass Criteria                                       | Stop-Ship | Phase |
| -------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- | --------- | ----- |
| SSL pinning works          | MITM via Charles for audio CDN                                             | Pinned domain rejects MITM cert, audio fails closed | Y         | 7+    |
| Deep-link allowlist        | Try `noor://reader/../etc/passwd`                                          | Sanitized; either 404 or refused                    | Y         | 4+    |
| Deep-link param validation | `noor://reader/9999` (out of range)                                        | Lands on +not-found, no crash                       | Y         | 4+    |
| Audio-cache integrity      | Corrupt a cached file with `dd`, replay                                    | Detects corruption, re-fetches, no crash            | Y         | 7+    |
| File:// sandbox respect    | Try to load arbitrary `file://` URI in WebView (n/a unless we add WebView) | n/a                                                 | N         | —     |

---

## Stop-Ship Aggregate

A tag is allowed if and only if:

- **0 red rows** across all categories.
- **All Stop-Ship Y rows pass** on every device in the matrix for the given phase.
- For `v1.0.0`: every row, every device, every OS version.

A failed Stop-Ship row blocks the tag. Open a fix branch, re-run the matrix, retag.
