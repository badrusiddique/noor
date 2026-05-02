/**
 * Surah cartouche — the ornamental band at the start of each surah.
 *
 * Matches the Pakistani 15-line printed Mushaf layout:
 * - Outer gold double-rule rectangle with decorative mid-line notches
 * - Surah name in Arabic (large, centered) on the right half
 * - Verse count + ruku count metadata on the left half
 * - Makkah / Madinah indicator
 * - Diamond ornament flanking the surah name on both sides
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';
import { colors, fontSize, mushafFont, spacing, typography } from '@/theme/tokens';

import type { SurahHeader } from '../../data/queries/page';

type Props = {
  surah: SurahHeader;
  width: number;
  height: number;
};

// Arabic Indic numerals for verse / ruku display (authentic Mushaf style)
function toArabicIndic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)] ?? d);
}

const REVELATION_LABEL: Record<'makkah' | 'madinah', string> = {
  makkah: 'مَكِّيَّة',
  madinah: 'مَدَنِيَّة',
};

function CartoucheImpl({ surah, width, height }: Props) {
  const theme = useTheme();
  const isNight = theme.name === 'night';
  const gold = isNight ? colors.goldLight : colors.gold;

  // Outer border inset
  const o = 2;
  // Inner border inset
  const inn = 6;
  // Mid-side notch half-length
  const notch = 10;
  const midY = height / 2;
  const midX = width / 2;

  const revLabel = REVELATION_LABEL[surah.revelationPlace];

  return (
    <View
      style={[styles.container, { width, height: height * 1.8 }]}
      accessibilityRole="header"
      accessibilityLabel={`Surah ${surah.nameTranslit}, ${String(surah.ayahCount)} verses`}
    >
      <Svg width={width} height={height * 1.8} style={StyleSheet.absoluteFill}>
        {/* Outer rule */}
        <Rect
          x={o}
          y={o}
          width={width - o * 2}
          height={height * 1.8 - o * 2}
          stroke={gold}
          strokeWidth={1.5}
          fill="none"
          rx={3}
        />
        {/* Inner rule */}
        <Rect
          x={inn}
          y={inn}
          width={width - inn * 2}
          height={height * 1.8 - inn * 2}
          stroke={gold}
          strokeWidth={0.75}
          fill="none"
          rx={2}
        />

        {/* Mid-top notch on inner rule */}
        <Line x1={midX - notch} y1={inn} x2={midX + notch} y2={inn} stroke={gold} strokeWidth={2} />

        {/* Mid-bottom notch on inner rule */}
        <Line
          x1={midX - notch}
          y1={height * 1.8 - inn}
          x2={midX + notch}
          y2={height * 1.8 - inn}
          stroke={gold}
          strokeWidth={2}
        />

        {/* Left-mid notch on inner rule */}
        <Line
          x1={inn}
          y1={midY * 1.8 - notch * 0.6}
          x2={inn}
          y2={midY * 1.8 + notch * 0.6}
          stroke={gold}
          strokeWidth={2}
        />

        {/* Right-mid notch on inner rule */}
        <Line
          x1={width - inn}
          y1={midY * 1.8 - notch * 0.6}
          x2={width - inn}
          y2={midY * 1.8 + notch * 0.6}
          stroke={gold}
          strokeWidth={2}
        />

        {/* Diamond ornament left of surah name */}
        <Circle cx={width * 0.2} cy={height * 0.9} r={3} fill={gold} />
        {/* Diamond ornament right of surah name */}
        <Circle cx={width * 0.8} cy={height * 0.9} r={3} fill={gold} />
      </Svg>

      <View style={styles.content}>
        {/* Top row: metadata */}
        <View style={styles.metaRow}>
          {/* Left: ruku count */}
          <Text
            allowFontScaling={false}
            style={[styles.metaText, { color: gold }]}
            numberOfLines={1}
          >
            {toArabicIndic(surah.rukuCount)} ع
          </Text>

          {/* Center: revelation place */}
          <Text
            allowFontScaling={false}
            style={[styles.revText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {revLabel}
          </Text>

          {/* Right: verse count */}
          <Text
            allowFontScaling={false}
            style={[styles.metaText, { color: gold }]}
            numberOfLines={1}
          >
            آيات {toArabicIndic(surah.ayahCount)}
          </Text>
        </View>

        {/* Surah name in Arabic */}
        <Text
          allowFontScaling={false}
          style={[styles.nameAr, { color: theme.mushafInk }]}
          numberOfLines={1}
        >
          سُورَة {surah.nameAr}
        </Text>

        {/* Bottom: transliteration */}
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
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxs,
  },
  metaText: {
    fontFamily: mushafFont,
    fontSize: fontSize.small - 1,
    writingDirection: 'rtl',
  },
  revText: {
    fontFamily: mushafFont,
    fontSize: fontSize.small - 1,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  nameAr: {
    fontFamily: mushafFont,
    fontSize: fontSize.title + 2,
    writingDirection: 'rtl',
    textAlign: 'center',
    letterSpacing: 1,
  },
  translit: {
    fontFamily: typography.inter,
    fontSize: fontSize.caption,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
