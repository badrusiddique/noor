import { colors } from './tokens';

export type Theme = {
  name: 'parchment' | 'night';
  bg: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  accent: string;
  mushafBg: string;
  mushafInk: string;
};

export const lightTheme: Theme = {
  name: 'parchment',
  bg: colors.parchment,
  surface: colors.surface,
  text: colors.ink,
  textSecondary: colors.inkSecondary,
  border: colors.border,
  primary: colors.primaryTeal,
  accent: colors.gold,
  mushafBg: colors.mushafBg,
  mushafInk: colors.mushafInk,
};

export const darkTheme: Theme = {
  name: 'night',
  bg: colors.nightBg,
  surface: colors.nightSurface,
  text: colors.nightInk,
  textSecondary: '#a39c8e',
  border: '#2a241d',
  primary: colors.nightAccent,
  accent: colors.goldLight,
  mushafBg: colors.nightBg,
  mushafInk: colors.nightInk,
};
