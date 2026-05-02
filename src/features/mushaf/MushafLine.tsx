/**
 * One Mushaf line — RTL Arabic text with embedded per-verse spans.
 *
 * Uses native CoreText / HarfBuzz shaping. The font is Amiri Quran
 * (Plan B, SIL OFL 1.1) — a dedicated Quran typesetting font with full
 * GDEF/GPOS tables for proper diacritic and contextual substitution.
 * Will switch to KFGQPC IndoPak when Plan A is resolved (ADR-0009).
 *
 * Text source: text_uthmani with full tashkeel (see queries/page.ts).
 * Embedded `<Text>` children let Phase 4 attach long-press handlers per
 * verse without re-rendering the entire line.
 */

import { memo } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { mushafFont } from '@/theme/tokens';

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
    fontFamily: mushafFont,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
