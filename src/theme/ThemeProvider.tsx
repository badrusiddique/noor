import { createContext, useMemo, type ReactNode } from 'react';

import { lightTheme, type Theme } from './themes';

type ThemeContextValue = {
  theme: Theme;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
});

type Props = {
  children: ReactNode;
};

/**
 * Phase 0: hardcode parchment (light) theme.
 *
 * Phase 2 will read system color scheme + user override from
 * `useSettingsStore.themeMode` and switch between `lightTheme` / `darkTheme`.
 */
export function ThemeProvider({ children }: Props) {
  const value = useMemo<ThemeContextValue>(() => ({ theme: lightTheme }), []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
