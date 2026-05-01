/**
 * Reader slice — the Mushaf reader's UI state.
 *
 * Persisted (via MMKV): currentPage, viewMode, script, fontSizePref.
 * Ephemeral: drawerState (always starts closed on cold start).
 *
 * Plan §5.2 — strict rule: SQLite owns persisted user data; Zustand is
 * a UI cache. This slice is the page cursor + per-user reader prefs;
 * any history/bookmark state lives elsewhere and writes to SQLite.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorage } from './persist';

export type ViewMode = 'mushaf' | 'study';
export type Script = 'indopak' | 'uthmani';
export type DrawerState = 'closed' | 'peek' | 'expanded';

export interface ReaderState {
  currentPage: number;
  viewMode: ViewMode;
  script: Script;
  /** User-chosen font size in points; clamped at render time per layout.ts. */
  fontSizePref: number;
  drawerState: DrawerState;

  setPage: (p: number) => void;
  setFontSizePref: (n: number) => void;
  toggleScript: () => void;
  setDrawerState: (s: DrawerState) => void;
}

const DEFAULT_FONT_SIZE = 26;

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      currentPage: 1,
      viewMode: 'mushaf',
      script: 'indopak',
      fontSizePref: DEFAULT_FONT_SIZE,
      drawerState: 'closed',

      setPage: (p) => {
        if (!Number.isInteger(p) || p < 1 || p > 604) return;
        set({ currentPage: p });
      },
      setFontSizePref: (n) => {
        if (!Number.isFinite(n)) return;
        // Hard floor; the soft cap is computed at render via layout.ts.
        const clamped = Math.max(14, Math.min(72, Math.floor(n)));
        set({ fontSizePref: clamped });
      },
      toggleScript: () => set((s) => ({ script: s.script === 'indopak' ? 'uthmani' : 'indopak' })),
      setDrawerState: (s) => set({ drawerState: s }),
    }),
    {
      name: 'noor.reader',
      storage: createJSONStorage(() => mmkvStorage),
      // Persist only the fields that should survive cold start; drawerState
      // always reopens closed so users don't return to a half-open sheet.
      partialize: (s) => ({
        currentPage: s.currentPage,
        viewMode: s.viewMode,
        script: s.script,
        fontSizePref: s.fontSizePref,
      }),
      version: 1,
    },
  ),
);
