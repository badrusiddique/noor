/**
 * One Mushaf page — fetches its DTO via `useMushafPage` and renders the
 * 15-line band, page chrome, surah cartouches, and basmala bands.
 *
 * Wrapped in React.memo with a custom comparator so neighbouring pages
 * in the windowed pager don't re-render when only the active page index
 * changes.
 *
 * Phase 2 alpha: page-border SVG + ornate art deferred. The container is
 * a clean parchment surface with the headers/footers in place.
 */

import { memo, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { fontSize, spacing, typography } from '@/theme/tokens';

import { BasmalaCartouche } from './BasmalaCartouche';
import { Cartouche } from './Cartouche';
import { useMushafPage } from './useMushafPage';
import { MushafLine } from './MushafLine';
import { PageFooter } from './PageFooter';
import { PageHeader } from './PageHeader';
import type { PageMetrics } from './layout';

type Props = {
  pageNo: number;
  metrics: PageMetrics;
  pageWidth: number;
};

function MushafPageImpl({ pageNo, metrics, pageWidth }: Props) {
  const theme = useTheme();
  const { data, isLoading, error } = useMushafPage(pageNo);

  const headerSurahName = useMemo(() => {
    if (!data) return '';
    // Header reflects the FIRST surah on the page (matches printed Mushaf
    // convention). If multiple surahs split the page, the bottom-of-page
    // surah header still shows above the line band as a Cartouche.
    const firstSurahLine = data.lines.find((l) => l.surahHeader);
    if (firstSurahLine?.surahHeader) return firstSurahLine.surahHeader.nameTranslit;
    const firstSpan = data.lines[0]?.spans[0];
    if (!firstSpan) return '';
    return `Surah ${firstSpan.surahNo}`;
  }, [data]);

  if (error) {
    return (
      <View style={[styles.page, { backgroundColor: theme.mushafBg }]}>
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: theme.text }]} allowFontScaling={false}>
            Couldn&apos;t load page {pageNo}
          </Text>
          <Text style={[styles.errorBody, { color: theme.textSecondary }]} allowFontScaling={false}>
            {error.message}
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading || !data) {
    return (
      <View style={[styles.page, { backgroundColor: theme.mushafBg }]}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      </View>
    );
  }

  // Cartouche/basmala band sizing: ~one line band tall.
  const bandHeight = metrics.lineHeight;
  const cartoucheWidth = Math.min(pageWidth - spacing.xxl * 2, 320);

  return (
    <View style={[styles.page, { backgroundColor: theme.mushafBg }]}>
      <PageHeader surahName={headerSurahName} juzNumber={data.juzNo} />

      <View style={styles.body}>
        {data.lines.map((line) => (
          <View key={line.lineNo} style={styles.lineWrap}>
            {line.surahHeader ? (
              <Cartouche surah={line.surahHeader} width={cartoucheWidth} height={bandHeight} />
            ) : null}
            {line.basmalaHeader ? (
              <BasmalaCartouche width={cartoucheWidth} height={bandHeight} />
            ) : null}
            <View style={[styles.lineBand, { height: bandHeight }]}>
              <MushafLine
                line={line}
                fontSize={metrics.effectiveFontSize}
                lineHeight={bandHeight}
              />
            </View>
          </View>
        ))}
      </View>

      <PageFooter pageNumber={pageNo} />
    </View>
  );
}

function arePropsEqual(a: Props, b: Props): boolean {
  return (
    a.pageNo === b.pageNo &&
    a.pageWidth === b.pageWidth &&
    a.metrics.effectiveFontSize === b.metrics.effectiveFontSize &&
    a.metrics.lineHeight === b.metrics.lineHeight
  );
}

export const MushafPage = memo(MushafPageImpl, arePropsEqual);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  lineWrap: {
    alignItems: 'stretch',
  },
  lineBand: {
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontFamily: typography.inter,
    fontSize: fontSize.bodyLarge,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  errorBody: {
    fontFamily: typography.inter,
    fontSize: fontSize.small,
    textAlign: 'center',
  },
});
