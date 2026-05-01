import { useContext } from 'react';

import { ThemeContext } from './ThemeProvider';
import type { Theme } from './themes';

export function useTheme(): Theme {
  const { theme } = useContext(ThemeContext);
  return theme;
}
