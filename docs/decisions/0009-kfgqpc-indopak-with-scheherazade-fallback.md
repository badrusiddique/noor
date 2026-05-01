# ADR-0009: KFGQPC IndoPak primary, Scheherazade New fallback; Plan B for licensing

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap

## Context

The IndoPak Mushaf has a distinct calligraphic tradition (Naskh-style, with specific glyph shapes for tashkeel and waqf marks) that South Asian readers grew up with. Rendering Quran text in any other script style — Madani, Uthmani-only — is wrong-feeling for the audience. The two relevant fonts are KFGQPC IndoPak Naskh (King Fahd Glorious Quran Printing Complex's IndoPak release) and Scheherazade New (SIL OFL).

KFGQPC IndoPak is the gold standard. Its license reads "free for personal and non-commercial use with attribution" — which raises questions for a free-but-publicly-distributed app. Is "free" enough to count as non-commercial? Most large Quran apps (Quran.com, etc.) bundle KFGQPC fonts and the practice has not drawn legal challenge in 20+ years, but "the others do it" is a weak legal argument.

Scheherazade New is OFL-licensed and unambiguously safe. Its glyph forms are Naskh but slightly different from KFGQPC — close enough for general legibility, not perfect for hafiz muscle memory.

## Decision

**Plan A (default):** ship KFGQPC IndoPak Naskh bundled in `assets/fonts/`. Attribute KFGQPC in `docs/THIRD_PARTY_NOTICES.md` and the in-app About screen. Reach out to KFGQPC for written confirmation that distribution in a free non-commercial app is fine.

**Plan B (fallback):** if licensing surfaces concretely (KFGQPC requests removal, App Store rejects on the basis of font licensing), switch to Scheherazade New as the bundled default. Offer KFGQPC as a one-time user-downloadable on first launch from a CDN — the user clicks accept and downloads ~4 MB. This shifts the bundling question from us to the end user.

The data layer stores both `text_uthmani` and `text_indopak` from Tanzil so the font swap is purely visual. The build-time render-and-assert test runs against KFGQPC; if we switch defaults to Scheherazade, the test re-runs against the new font and the page line breaks may shift — Phase 1 would need to re-verify the 15-line invariant.

## Alternatives considered

- **A: Bundle KFGQPC, attribute, hope (chosen Plan A).** What every other major Quran app does. License gray area but de-facto accepted.
- **B: Scheherazade New only.** Unambiguously safe, slightly worse fidelity for hafiz readers.
- **C: Both bundled, user picks in Settings.** Doubles bundle weight, doesn't really solve the licensing concern (we'd still be distributing KFGQPC).
- **D: KFGQPC as one-time user download, Scheherazade default (Plan B).** Shifts distribution responsibility. Worse first-run UX (download interstitial on first launch).

## Consequences

Positive: Plan A gives the audience the font they expect from day one. Plan B exists as a real fallback if licensing forces the issue.

Negative: Plan A has residual legal ambiguity. We document it openly in `docs/THIRD_PARTY_NOTICES.md` and the About screen so the posture is transparent.

## Verification

Plan A verification: KFGQPC bundled, render-and-assert passes on all 604 pages, attribution displays. Plan B is a documented runbook — if we ever flip, schema is unchanged; only `assets/fonts/` and the font registration in `app/_layout.tsx` change.
