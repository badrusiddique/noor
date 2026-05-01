/**
 * Ruku mark — small gold circle in the right margin marking a ruku
 * boundary. Phase 2 alpha is a placeholder dot; the printed Mushaf
 * uses an ornate badge that will land in Phase 2 beta art.
 */

import { memo } from 'react';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';
import { colors } from '@/theme/tokens';

type Props = {
  size?: number;
};

function RukuMarkImpl({ size = 10 }: Props) {
  const theme = useTheme();
  const fill = theme.name === 'night' ? colors.goldLight : colors.gold;
  return (
    <Svg width={size} height={size} accessibilityLabel="ruku">
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill={fill} />
    </Svg>
  );
}

export const RukuMark = memo(RukuMarkImpl);
