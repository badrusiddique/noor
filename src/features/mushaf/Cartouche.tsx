/**
 * Surah cartouche — the ornamental band at the start of each surah.
 *
 * Phase 2 alpha: a clean rectangle with a gold double-stroke and the
 * surah's Arabic name + transliteration centered. The full ornate SVG
 * art from the design package is a Phase 2 beta deliverable.
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';
import { colors, fontSize, spacing, typography } from '@/theme/tokens';

import type { SurahHeader } from '../../data/queries/page';

type Props = {
  surah: SurahHeader;
  width: number;
  height: number;
};

function CartoucheImpl({ surah, width, height }: Props) {
  const theme = useTheme();
  const isNight = theme.name === 'night';
  const goldStroke = isNight ? colors.goldLight : colors.gold;

  return (
    <View style={[styles.container, { width, height }]} accessibilityRole="header">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Rect
          x={4}
          y={4}
          width={width - 8}
          height={height - 8}
          rx={6}
          stroke={goldStroke}
          strokeWidth={1.5}
          fill="transparent"
        />
        <Rect
          x={9}
          y={9}
          width={width - 18}
          height={height - 18}
          rx={4}
          stroke={goldStroke}
          strokeWidth={0.75}
          fill="transparent"
          opacity={0.6}
        />
      </Svg>
      <View style={styles.content}>
        <Text
          allowFontScaling={false}
          style={[styles.nameAr, { color: theme.mushafInk }]}
          numberOfLines={1}
        >
          {surah.nameAr}
        </Text>
        <Text
          allowFontScaling={false}
          style={[styles.translit, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {surah.nameTranslit}
        </Text>
      </View>
    </View>
  );
}

export const Cartouche = memo(CartoucheImpl);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  nameAr: {
    fontFamily: typography.scheherazadeNew,
    fontSize: fontSize.title,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  translit: {
    fontFamily: typography.inter,
    fontSize: fontSize.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
