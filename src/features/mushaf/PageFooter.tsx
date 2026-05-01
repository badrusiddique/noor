/**
 * Bottom chrome strip — page number centered. LTR Latin chrome.
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { fontSize, spacing, typography } from '@/theme/tokens';

type Props = {
  pageNumber: number;
};

function PageFooterImpl({ pageNumber }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text allowFontScaling={false} style={[styles.text, { color: theme.textSecondary }]}>
        {pageNumber}
      </Text>
    </View>
  );
}

export const PageFooter = memo(PageFooterImpl);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  text: {
    fontFamily: typography.inter,
    fontSize: fontSize.small,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
