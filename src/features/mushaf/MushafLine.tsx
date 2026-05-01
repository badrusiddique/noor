/**
 * One Mushaf line — RTL Arabic text with embedded per-verse spans.
 *
 * Uses native CoreText / HarfBuzz shaping (the platform handles
 * ligature shaping for Arabic when given a fontFamily). Embedded
 * `<Text>` children let Phase 4 attach long-press handlers per verse
 * without re-rendering the entire line.
 */

import { memo } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { typography } from '@/theme/tokens';

import type { PageLine } from '../../data/queries/page';

type Props = {
  line: PageLine;
  fontSize: number;
  lineHeight: number;
};

function MushafLineImpl({ line, fontSize, lineHeight }: Props) {
  const theme = useTheme();
  const lineStyle: TextStyle = {
    fontSize,
    lineHeight,
    color: theme.mushafInk,
  };

  return (
    <Text
      style={[styles.line, lineStyle]}
      allowFontScaling={false}
      textBreakStrategy="simple"
      android_hyphenationFrequency="none"
      selectable={false}
    >
      {line.spans.map((span, idx) => (
        <Text key={span.verseId} suppressHighlighting>
          {span.text}
          {idx < line.spans.length - 1 ? ' ' : ''}
        </Text>
      ))}
    </Text>
  );
}

export const MushafLine = memo(MushafLineImpl);

const styles = StyleSheet.create({
  line: {
    writingDirection: 'rtl',
    textAlign: 'right',
    fontFamily: typography.scheherazadeNew,
    // Phase 2 beta TODO: swap to typography.kfgqpcIndoPak when ADR-0009
    // Plan A succeeds (Phase 1c). Per ADR-0009 Plan B, Scheherazade is
    // the alpha font; line-break fidelity is approximate without KFGQPC.
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
