/**
 * Noor design tokens.
 *
 * Source of truth for colors, typography, and spacing. Do not hardcode hex
 * values elsewhere — derive themes from these tokens.
 */

export const colors = {
  // Surfaces
  parchment: '#f7f3ec',
  parchmentDeep: '#efe7d8',
  surface: '#ffffff',

  // Ink (text)
  ink: '#1a1410',
  inkSecondary: '#5a5147',
  inkTertiary: '#7a6f63',
  inkDisabled: '#b5ada1',

  // Border / divider
  border: '#d4c8b4',
  borderSubtle: '#e6dccb',

  // Brand
  primaryTeal: '#1f6b6b',
  primaryTealDeep: '#0f4f4f',
  gold: '#b48a3a',
  goldLight: '#d4a85a',

  // Mushaf surfaces
  mushafBg: '#f5ecd6',
  mushafInk: '#1a1410',

  // Night theme — true OLED black
  nightBg: '#000000',
  nightSurface: '#0a0a0a',
  nightInk: '#e8e3d8',
  nightAccent: '#3aa39a',

  // States
  danger: '#b53a3a',
  warning: '#c87b1d',
  success: '#2f8b4f',
} as const;

export const typography = {
  // UI sans-serif (Latin)
  inter: 'Inter',
  // UI serif (display)
  fraunces: 'Fraunces',
  // Arabic Mushaf — primary
  kfgqpcIndoPak: 'KFGQPC-IndopakNaskh',
  // Arabic Mushaf — fallback (Plan B if KFGQPC licensing surfaces issues)
  scheherazadeNew: 'ScheherazadeNew',
  // Arabic translation typesetting (Egyptian Naskh)
  amiriQuran: 'AmiriQuran',
  // Urdu UI / translations
  notoNastaliqUrdu: 'NotoNastaliqUrdu',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const fontSize = {
  caption: 11,
  small: 13,
  body: 15,
  bodyLarge: 17,
  title: 20,
  display: 28,
  hero: 40,
} as const;

export type Tokens = {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  fontSize: typeof fontSize;
};

export const tokens: Tokens = { colors, typography, spacing, radii, fontSize };
