# ADR-0006: Per-component RTL, never `I18nManager.forceRTL`

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Badrudduza Siddique
- **Context tag:** Phase 0 — Bootstrap

## Context

Noor renders Arabic Quran text (RTL) and Urdu UI strings (RTL) alongside English UI (LTR), and Hindi/Bangla in v1.1. React Native exposes `I18nManager.forceRTL(true)` which flips the entire app layout — flexbox, margins, paddings, navigation animations, everything mirrors. Calling it requires an app reload. Calling it conditionally based on user locale is a popular pattern but has serious downsides for our use case.

The chrome (back buttons, bottom tabs, settings rows) of Noor is mostly LTR-shaped — the back arrow goes back regardless of locale, the bottom tab order is consistent. Arabic content is RTL inside its `Text` component. The two layout axes are independent. Calling `forceRTL` would invert the chrome too, which is not what we want for Urdu UI users (they expect Urdu strings, not a mirrored app).

## Decision

Never call `I18nManager.forceRTL(true)`. Instead, RTL is declared per-component via style fragments in `src/lib/rtl.ts`:

```ts
export const arabic = { writingDirection: 'rtl', textAlign: 'right' } as const;
export const urdu = arabic;
export const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;
```

The `MushafPager` is the one place that uses `layoutDirection="rtl"` (so page 1 is rightmost, matching a printed Mushaf binding). All other RTL is at the `Text` level. UI locale (en/ur/hi/bn) is independent of content directionality — Urdu UI = Urdu strings, but the chrome stays LTR-positioned.

## Alternatives considered

- **A: `I18nManager.forceRTL(true)` based on locale.** Standard pattern. Mirrors the entire app. Wrong for our chrome and forces an app reload on locale change.
- **B: Per-component RTL (chosen).** Surgical. No reload needed. Chrome and content directionality decoupled.
- **C: A custom layout direction context.** Reinvents the wheel. Existing per-component RTL via `writingDirection` is sufficient.

## Consequences

Positive: locale changes are instant (no reload). Chrome is consistent across locales. Arabic and Urdu render correctly within their text components without affecting flexbox.

Negative: every Arabic/Urdu `Text` component must opt in via the style fragments — a contributor who forgets gets a left-aligned Arabic line. Lint rule candidate for the future. Documented in CONTRIBUTING.

## Verification

Toggle UI locale to Urdu in Settings — every UI string translates, no app reload, chrome layout unchanged. Arabic Mushaf text remains right-aligned with RTL writing direction. No call to `I18nManager.forceRTL` exists in the codebase (CI grep check).
