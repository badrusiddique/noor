/**
 * The horizontal Mushaf pager.
 *
 * Wraps `react-native-pager-view` with a 5-page sliding window
 * (current ± 2). The native pager handles RTL layout natively
 * (`layoutDirection="rtl"`), so page 1 is rightmost — matching how
 * a printed Mushaf opens.
 *
 * Plan §5.3 perf budget: re-key on `currentPage` so the windowed slice
 * always re-mounts in-place; offscreenPageLimit=1 keeps native costs
 * to one neighbour each side; prefetch fires on `setPage` so SQLite
 * is warm before the next swipe lands.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { MushafPage } from './MushafPage';
import { computePageMetrics } from './layout';
import { prefetchPage } from './useMushafPage';

const TOTAL_PAGES = 604;
const WINDOW_RADIUS = 2; // current ± 2 → 5 pages

type Props = {
  initialPage: number;
  fontSizePref: number;
  onPageChanged: (pageNo: number) => void;
};

function clampPage(p: number): number {
  if (p < 1) return 1;
  if (p > TOTAL_PAGES) return TOTAL_PAGES;
  return p;
}

function buildWindow(centre: number): number[] {
  const start = Math.max(1, centre - WINDOW_RADIUS);
  const end = Math.min(TOTAL_PAGES, centre + WINDOW_RADIUS);
  const out: number[] = [];
  for (let p = start; p <= end; p++) out.push(p);
  return out;
}

export function MushafPager({ initialPage, fontSizePref, onPageChanged }: Props) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);

  const [centrePage, setCentrePage] = useState(() => clampPage(initialPage));

  const windowPages = useMemo(() => buildWindow(centrePage), [centrePage]);
  const initialIndex = useMemo(
    () => windowPages.findIndex((p) => p === centrePage),
    [windowPages, centrePage],
  );

  const metrics = useMemo(
    () =>
      computePageMetrics({
        screenHeight: height,
        topInset: insets.top,
        bottomInset: insets.bottom,
        fontSizePref,
      }),
    [height, insets.top, insets.bottom, fontSizePref],
  );

  // Warm the cache for adjacent pages on cold mount + after each swipe.
  useEffect(() => {
    prefetchPage(centrePage - 1);
    prefetchPage(centrePage + 1);
    prefetchPage(centrePage - 2);
    prefetchPage(centrePage + 2);
  }, [centrePage]);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const idx = e.nativeEvent.position;
      const newPage = windowPages[idx];
      if (newPage === undefined) return;
      if (newPage === centrePage) return;
      setCentrePage(newPage);
      onPageChanged(newPage);
    },
    [windowPages, centrePage, onPageChanged],
  );

  // Re-key the pager when the centre changes so the window slides clean.
  // (React reconciliation can't shuffle children across a native pager
  // safely; remount is the documented escape hatch.)
  const pagerKey = `mushaf-pager-${String(centrePage)}`;

  return (
    <View style={[styles.root, { backgroundColor: theme.mushafBg }]}>
      <PagerView
        key={pagerKey}
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex < 0 ? 0 : initialIndex}
        orientation="horizontal"
        layoutDirection="rtl"
        offscreenPageLimit={1}
        onPageSelected={handlePageSelected}
      >
        {windowPages.map((p) => (
          <View key={`page-${String(p)}`} style={styles.pageContainer} collapsable={false}>
            <MushafPage pageNo={p} metrics={metrics} pageWidth={width} pageHeight={height} />
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
});
