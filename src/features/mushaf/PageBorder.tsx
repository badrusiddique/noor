/**
 * Ornate gold double-rule page border — the defining visual element of the
 * Pakistani 15-line printed Mushaf. An outer heavier rule + inner finer rule
 * with a small gap between them, rendered as SVG so it scales exactly to the
 * available page area.
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';
import { colors } from '@/theme/tokens';

type Props = {
  width: number;
  height: number;
};

function PageBorderImpl({ width, height }: Props) {
  const theme = useTheme();
  const isNight = theme.name === 'night';
  const gold = isNight ? colors.goldLight : colors.gold;
  const goldFaint = isNight ? 'rgba(212,168,90,0.4)' : 'rgba(180,138,58,0.4)';

  // Outer rule
  const o = 3;
  // Inner rule
  const i = 8;
  // Corner bracket inset for the decorative notch
  const cornerLen = 18;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.border]} pointerEvents="none">
      <Svg width={width} height={height}>
        {/* Outer heavy rule */}
        <Rect
          x={o}
          y={o}
          width={width - o * 2}
          height={height - o * 2}
          stroke={gold}
          strokeWidth={1.5}
          fill="none"
        />
        {/* Inner finer rule */}
        <Rect
          x={i}
          y={i}
          width={width - i * 2}
          height={height - i * 2}
          stroke={gold}
          strokeWidth={0.75}
          fill="none"
        />

        {/* Top-left corner bracket ticks */}
        <Line
          x1={o}
          y1={o + cornerLen}
          x2={i}
          y2={o + cornerLen}
          stroke={goldFaint}
          strokeWidth={0.75}
        />
        <Line
          x1={o + cornerLen}
          y1={o}
          x2={o + cornerLen}
          y2={i}
          stroke={goldFaint}
          strokeWidth={0.75}
        />

        {/* Top-right corner bracket ticks */}
        <Line
          x1={width - o}
          y1={o + cornerLen}
          x2={width - i}
          y2={o + cornerLen}
          stroke={goldFaint}
          strokeWidth={0.75}
        />
        <Line
          x1={width - o - cornerLen}
          y1={o}
          x2={width - o - cornerLen}
          y2={i}
          stroke={goldFaint}
          strokeWidth={0.75}
        />

        {/* Bottom-left corner bracket ticks */}
        <Line
          x1={o}
          y1={height - o - cornerLen}
          x2={i}
          y2={height - o - cornerLen}
          stroke={goldFaint}
          strokeWidth={0.75}
        />
        <Line
          x1={o + cornerLen}
          y1={height - o}
          x2={o + cornerLen}
          y2={height - i}
          stroke={goldFaint}
          strokeWidth={0.75}
        />

        {/* Bottom-right corner bracket ticks */}
        <Line
          x1={width - o}
          y1={height - o - cornerLen}
          x2={width - i}
          y2={height - o - cornerLen}
          stroke={goldFaint}
          strokeWidth={0.75}
        />
        <Line
          x1={width - o - cornerLen}
          y1={height - o}
          x2={width - o - cornerLen}
          y2={height - i}
          stroke={goldFaint}
          strokeWidth={0.75}
        />
      </Svg>
    </View>
  );
}

export const PageBorder = memo(PageBorderImpl);

const styles = StyleSheet.create({
  border: {
    zIndex: 0,
  },
});
