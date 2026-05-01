# Third-Party Notices

Noor builds on the work of many open-source projects, scholarly editors, and font designers. This document catalogues every third-party asset and code dependency, with attribution and license summary.

A machine-generated full license inventory is produced by the supply-chain workflow (`.github/workflows/supply-chain.yml`) and attached as `licenses.json` to each GitHub Release.

---

## Quran Text & Translations

### Tanzil.net — Arabic Quran text + page metadata

- **What we use:** `quran-uthmani.xml` (Uthmani script), `quran-simple.xml` (subcontinent variant), `quran-data.xml` (page/juz/hizb/sajdah metadata).
- **License:** Creative Commons Attribution 3.0 (CC-BY-3.0).
- **Attribution:** Tanzil Project — https://tanzil.net
- **In-app attribution:** About screen + this document.

### Kanzul Iman — Urdu translation by Aḥmad Raza Khan (d. 1921)

- **License:** Public domain (author deceased >70 years).
- **Source distribution:** QuranEnc.com `urdu_raza`.
- **Attribution:** "Kanzul Iman by Mawlana Ahmad Raza Khan, public domain."

### Tafhim-ul-Quran — Urdu translation by Sayyid Abul A'la Maududi (d. 1979)

- **License:** Free non-commercial digital distribution (per QuranEnc / Idara Tarjuman al-Qur'an).
- **Source distribution:** QuranEnc.com `urdu_maududi`.
- **Attribution:** "Tafhim-ul-Quran by Sayyid Abul A'la Maududi, distributed via QuranEnc.com."

### Saheeh International — English translation (1997)

- **License:** Free non-commercial digital distribution with attribution (Al-Muntada Al-Islami Trust).
- **Source distribution:** Tanzil `en.sahih.xml`.
- **Attribution:** "The Quran — English Meanings, Saheeh International, courtesy of Al-Muntada Al-Islami Trust."

---

## Fonts

### KFGQPC IndoPak Naskh

- **What we use:** Primary Mushaf font, bundled at `assets/fonts/KFGQPC-IndoPak.ttf` (~4 MB).
- **License:** "Free for personal and non-commercial use with attribution" per the King Fahd Glorious Quran Printing Complex.
- **Attribution:** "KFGQPC IndoPak Naskh font, © King Fahd Glorious Quran Printing Complex, used for Quranic display under non-commercial license."
- **Plan B:** if licensing surfaces issues, fall back to Scheherazade New (SIL OFL) — see ADR-0009.

### Scheherazade New

- **What we use:** Optional fallback Arabic font.
- **License:** SIL Open Font License 1.1.
- **Attribution:** "Scheherazade New, © SIL International."

### Inter

- **What we use:** UI sans-serif.
- **License:** SIL Open Font License 1.1.
- **Attribution:** "Inter, © Rasmus Andersson."

### Fraunces

- **What we use:** UI display serif.
- **License:** SIL Open Font License 1.1.
- **Attribution:** "Fraunces, © Phaedra Charles, Flavia Zimbardi, David Berlow."

### Amiri Quran

- **What we use:** Arabic translation typesetting.
- **License:** SIL Open Font License 1.1.
- **Attribution:** "Amiri Quran, © Khaled Hosny."

### Noto Nastaliq Urdu

- **What we use:** Urdu translation rendering.
- **License:** SIL Open Font License 1.1.
- **Attribution:** "Noto Nastaliq Urdu, © Google Fonts."

---

## Audio Recitations

Streamed from public CDNs at runtime. Bundled offline: Surah Al-Fatihah by Mishary Rashid Alafasy (~200 KB).

| Reciter                            | Source                                    | Notes                                        |
| ---------------------------------- | ----------------------------------------- | -------------------------------------------- |
| Mishary Rashid Alafasy             | everyayah.com / download.quranicaudio.com | Public Quranic recitation, free distribution |
| Saad Al-Ghamdi                     | everyayah.com / download.quranicaudio.com | Public Quranic recitation, free distribution |
| Abdul Basit Abdul Samad (Mujawwad) | everyayah.com / download.quranicaudio.com | Public Quranic recitation, free distribution |

---

## Open-Source Dependencies

Every npm dependency is listed with its license in the `licenses.json` artifact attached to each GitHub Release. The supply-chain workflow fails CI if any GPL-2.0, GPL-3.0, AGPL-1.0, or AGPL-3.0 license appears.

Notable runtime dependencies:

- **Expo / React Native** — MIT
- **`@op-engineering/op-sqlite`** — MIT
- **`@gorhom/bottom-sheet`** — MIT
- **`@shopify/flash-list`** — MIT
- **`react-native-reanimated`** — MIT
- **`react-native-track-player`** — Apache-2.0
- **`react-native-mmkv`** — MIT
- **`zustand`** — MIT
- **`@sentry/react-native`** — MIT

For the complete machine-readable list, see the SBOM (CycloneDX) attached to each release.

---

## How to Report a Licensing Concern

If you believe Noor is misattributing or improperly using a third-party asset, email `badru.siddique@hudl.com` with the specifics. We respond within 7 days and will remove or correct attribution as needed.
