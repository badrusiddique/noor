/**
 * MushafPager — web stub.
 *
 * The native pager wraps `react-native-pager-view`, which has no web
 * implementation (`PagerViewNativeComponent` codegen-imports a native
 * module that explodes during web bundling). On web we never render the
 * pager — the reader route is itself stubbed at `app/reader/[page].web.tsx`
 * — but Metro still walks the import graph statically, so we provide a
 * web-only variant via the standard platform-extension resolver.
 *
 * This file must NOT import `react-native-pager-view` (or anything that
 * does, transitively).
 */
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

type Props = {
  initialPage: number;
  fontSizePref: number;
  onPageChanged: (pageNo: number) => void;
};

export function MushafPager(_props: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.mushafBg }]}>
      <Text style={[styles.text, { color: theme.text }]}>
        Mushaf rendering is mobile-only on web.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
