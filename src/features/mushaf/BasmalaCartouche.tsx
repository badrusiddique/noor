/**
 * Basmala band — "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" rendered before the
 * first ayah of any surah other than Al-Fatihah and At-Tawbah.
 *
 * Styled to match the Pakistani printed Mushaf: gold oval frame with
 * flanking ornament marks, Uthmani text in the Mushaf font.
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Line } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';
import { colors, mushafFont, spacing } from '@/theme/tokens';

// Full Uthmani basmala with all diacritics — the authoritative form.
const BASMALA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

type Props = {
  width: number;
  height: number;
};

function BasmalaCartoucheImpl({ width, height }: Props) {
  const theme = useTheme();
  const isNight = theme.name === 'night';
  const gold = isNight ? colors.goldLight : colors.gold;

  const ovalRx = width * 0.38;
  const ovalRy = height * 0.42;
  const cx = width / 2;
  const cy = height / 2;

  // Flanking dash ornaments
  const dashLen = 14;
  const dashY = cy;
  const dashGap = ovalRx + 8;

  return (
    <View
      style={[styles.container, { width, height }]}
      accessibilityLabel="Bismillah ir-Rahman ir-Raheem"
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Oval frame */}
        <Ellipse
          cx={cx}
          cy={cy}
          rx={ovalRx}
          ry={ovalRy}
          stroke={gold}
          strokeWidth={1.25}
          fill="none"
        />
        {/* Inner oval */}
        <Ellipse
          cx={cx}
          cy={cy}
          rx={ovalRx - 4}
          ry={ovalRy - 4}
          stroke={gold}
          strokeWidth={0.6}
          fill="none"
          opacity={0.5}
        />

        {/* Left ornament dash */}
        <Line
          x1={cx - dashGap - dashLen}
          y1={dashY}
          x2={cx - dashGap}
          y2={dashY}
          stroke={gold}
          strokeWidth={1.25}
        />

        {/* Right ornament dash */}
        <Line
          x1={cx + dashGap}
          y1={dashY}
          x2={cx + dashGap + dashLen}
          y2={dashY}
          stroke={gold}
          strokeWidth={1.25}
        />
      </Svg>

      <Text
        allowFontScaling={false}
        style={[styles.text, { color: theme.mushafInk, fontSize: Math.floor(height * 0.38) }]}
        numberOfLines={1}
      >
        {BASMALA}
      </Text>
    </View>
  );
}

export const BasmalaCartouche = memo(BasmalaCartoucheImpl);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xxs,
    alignSelf: 'center',
  },
  text: {
    fontFamily: mushafFont,
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: undefined,
    includeFontPadding: false,
  },
});
