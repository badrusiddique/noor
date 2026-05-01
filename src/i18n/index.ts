import { I18n, type TranslateOptions } from 'i18n-js';
import * as Localization from 'expo-localization';

import en from './en.json';
import ur from './ur.json';

export type Locale = 'en' | 'ur';

const i18n = new I18n({ en, ur });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';
i18n.locale = 'en';

/**
 * Initialize i18n with the device's preferred locale (if supported).
 * Defaults to English. Called from `app/_layout.tsx` on cold start.
 */
export async function initI18n(): Promise<void> {
  const locales = Localization.getLocales();
  const first = locales[0];
  const code = first?.languageCode;
  if (code === 'ur') {
    i18n.locale = 'ur';
  } else {
    i18n.locale = 'en';
  }
}

export function t(key: string, params?: TranslateOptions): string {
  return i18n.t(key, params);
}

export function setLocale(loc: Locale): void {
  i18n.locale = loc;
}

export function getLocale(): Locale {
  return (i18n.locale as Locale) ?? 'en';
}

export default i18n;
