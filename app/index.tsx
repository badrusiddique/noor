import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReaderStore } from '@/state/reader';
import { useTheme } from '@/theme/useTheme';
import { fontSize, spacing, typography } from '@/theme/tokens';

export default function Home() {
  const router = useRouter();
  const theme = useTheme();
  const currentPage = useReaderStore((s) => s.currentPage);
  const version = (Constants.expoConfig?.version as string | undefined) ?? '0.1.0';

  const openMushaf = () => {
    router.push(`/reader/${String(currentPage)}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.container}>
        <Text style={[styles.brand, { color: theme.text }]}>Noor</Text>
        <Text style={[styles.version, { color: theme.textSecondary }]}>v{version}</Text>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Text style={[styles.title, { color: theme.text }]}>Phase 2 alpha — Mushaf reader</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Tap below to open the Mushaf at your last-read page.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Mushaf"
          onPress={openMushaf}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.buttonLabel} allowFontScaling={false}>
            Open Mushaf · page {currentPage}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  brand: {
    fontFamily: typography.inter,
    fontSize: fontSize.hero,
    fontWeight: '600',
    letterSpacing: -1,
  },
  version: {
    fontFamily: typography.inter,
    fontSize: fontSize.small,
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: 64,
    marginVertical: spacing.xl,
  },
  title: {
    fontFamily: typography.inter,
    fontSize: fontSize.bodyLarge,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: typography.inter,
    fontSize: fontSize.small,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 240,
  },
  buttonLabel: {
    fontFamily: typography.inter,
    color: '#ffffff',
    fontSize: fontSize.body,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
