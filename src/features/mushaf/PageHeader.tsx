/**
 * Top chrome strip — surah name on the left, juz number on the right.
 * Latin (Inter) font; LTR layout per plan §5.5 (chrome stays LTR).
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { fontSize, spacing, typography } from '@/theme/tokens';

type Props = {
  surahName: string;
  juzNumber: number;
};

function PageHeaderImpl({ surahName, juzNumber }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text
        allowFontScaling={false}
        style={[styles.text, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        {surahName}
      </Text>
      <Text
        allowFontScaling={false}
        style={[styles.text, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        Juz {juzNumber}
      </Text>
    </View>
  );
}

export const PageHeader = memo(PageHeaderImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: {
    fontFamily: typography.inter,
    fontSize: fontSize.small,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
