/**
 * Mushaf reader route — `/reader/<pageNo>`.
 *
 * Reads `pageNo` from the URL param, mounts the Mushaf pager, and
 * persists the current page through the Zustand reader store.
 * Hides the (future) tab bar so the page is full-screen.
 */

import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MushafPager } from '@/features/mushaf/MushafPager';
import { useReaderStore } from '@/state/reader';
import { useTheme } from '@/theme/useTheme';

function parsePageParam(raw: unknown): number {
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 604) return n;
  }
  if (Array.isArray(raw) && raw[0]) {
    return parsePageParam(raw[0]);
  }
  return 1;
}

export default function ReaderPage() {
  const params = useLocalSearchParams<{ page?: string }>();
  const initialPage = useMemo(() => parsePageParam(params.page), [params.page]);
  const fontSizePref = useReaderStore((s) => s.fontSizePref);
  const setPage = useReaderStore((s) => s.setPage);
  const theme = useTheme();

  const handlePageChanged = useCallback(
    (p: number) => {
      setPage(p);
    },
    [setPage],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.mushafBg }]}>
      <Stack.Screen
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.mushafBg },
        }}
      />
      <MushafPager
        initialPage={initialPage}
        fontSizePref={fontSizePref}
        onPageChanged={handlePageChanged}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
