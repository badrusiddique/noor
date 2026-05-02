/**
 * Bottom chrome strip — gold separator line + page number centered.
 * Page number shown in Arabic-Indic numerals flanked by ornament dashes,
 * matching the Pakistani 15-line printed Mushaf footer style.
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { colors, fontSize, mushafFont, spacing } from '@/theme/tokens';

type Props = {
  pageNumber: number;
};

function toArabicIndic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)] ?? d);
}

function PageFooterImpl({ pageNumber }: Props) {
  const theme = useTheme();
  const isNight = theme.name === 'night';
  const gold = isNight ? colors.goldLight : colors.gold;

  return (
    <View style={styles.wrapper}>
      {/* Gold separator */}
      <View style={[styles.divider, { backgroundColor: gold }]} />
      <View style={styles.row}>
        {/* Left ornament */}
        <View style={[styles.dash, { backgroundColor: gold }]} />

        {/* Page number in Arabic-Indic */}
        <Text allowFontScaling={false} style={[styles.pageNum, { color: gold }]}>
          {toArabicIndic(pageNumber)}
        </Text>

        {/* Right ornament */}
        <View style={[styles.dash, { backgroundColor: gold }]} />
      </View>
    </View>
  );
}

export const PageFooter = memo(PageFooterImpl);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.7,
    marginBottom: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dash: {
    width: 20,
    height: 1,
    opacity: 0.6,
  },
  pageNum: {
    fontFamily: mushafFont,
    fontSize: fontSize.small,
    textAlign: 'center',
  },
});
