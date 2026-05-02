/**
 * Top chrome strip matching the Pakistani 15-line Mushaf layout:
 * - Arabic surah name (right-aligned, Arabic font)
 * - Juz number in Arabic-Indic numerals + الجزء label (left-aligned)
 * - Gold separator line underneath
 *
 * Chrome stays LTR-positioned per plan §5.5, but the surah name uses
 * Arabic script and writingDirection="rtl" for correct shaping.
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { colors, fontSize, mushafFont, spacing } from '@/theme/tokens';

type Props = {
  surahName: string;
  juzNumber: number;
  hizbNumber?: number;
};

function toArabicIndic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)] ?? d);
}

function PageHeaderImpl({ surahName, juzNumber, hizbNumber }: Props) {
  const theme = useTheme();
  const isNight = theme.name === 'night';
  const gold = isNight ? colors.goldLight : colors.gold;

  // Hizb info: each juz has 8 hizbs. Display as "الحزب X" when available.
  const hizbLabel = hizbNumber != null ? `الحِزْب ${toArabicIndic(hizbNumber)}` : null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {/* Left: Juz info */}
        <Text allowFontScaling={false} style={[styles.juzText, { color: gold }]} numberOfLines={1}>
          {`الجُزْء ${toArabicIndic(juzNumber)}`}
          {hizbLabel != null ? `  ${hizbLabel}` : ''}
        </Text>

        {/* Right: Surah name in Arabic */}
        {surahName.length > 0 ? (
          <Text
            allowFontScaling={false}
            style={[styles.surahName, { color: theme.mushafInk }]}
            numberOfLines={1}
          >
            {surahName}
          </Text>
        ) : null}
      </View>
      {/* Gold separator */}
      <View style={[styles.divider, { backgroundColor: gold }]} />
    </View>
  );
}

export const PageHeader = memo(PageHeaderImpl);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  surahName: {
    fontFamily: mushafFont,
    fontSize: fontSize.body,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  juzText: {
    fontFamily: mushafFont,
    fontSize: fontSize.small,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  divider: {
    height: 1,
    opacity: 0.7,
  },
});
