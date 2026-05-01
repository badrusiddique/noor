/**
 * Basmala band — the leading "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" rendered
 * before the first ayah of any surah other than Al-Fatihah and Tawbah.
 *
 * Phase 2 alpha: minimal centered band. Ornate SVG flourishes are
 * Phase 2 beta art.
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { fontSize, spacing, typography } from '@/theme/tokens';

const BASMALA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

type Props = {
  width: number;
  height: number;
};

function BasmalaCartoucheImpl({ width, height }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { width, height }]}>
      <Text
        allowFontScaling={false}
        style={[styles.text, { color: theme.mushafInk }]}
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
  },
  text: {
    fontFamily: typography.scheherazadeNew,
    fontSize: fontSize.bodyLarge,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
