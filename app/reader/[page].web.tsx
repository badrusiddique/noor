/**
 * Mushaf reader route — web stub.
 *
 * The Mushaf renderer depends on `react-native-pager-view`,
 * `@op-engineering/op-sqlite`, and `react-native-mmkv` — all native-only.
 * Web exists for theme + design-system iteration; running the reader on
 * web is intentionally not supported. Metro picks this file when
 * bundling for `Platform.OS === 'web'` because of the `.web.tsx`
 * extension.
 */
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';
import { fontSize, spacing, typography } from '@/theme/tokens';

export default function ReaderWebStub() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Mushaf is mobile-only</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          The Quran reader uses a JSI-backed SQLite database and a native page-view component that
          have no web implementation. Web is only available for the home placeholder and the design
          system.
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          To run the full reader, build the Expo dev client (Android APK) or use the iOS Simulator
          on macOS. See the README "How to run" section.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back home"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.buttonLabel} allowFontScaling={false}>
            Back to home
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
    maxWidth: 560,
    alignSelf: 'center',
  },
  title: {
    fontFamily: typography.inter,
    fontSize: fontSize.bodyLarge,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  body: {
    fontFamily: typography.inter,
    fontSize: fontSize.body,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    marginTop: spacing.md,
  },
  buttonLabel: {
    fontFamily: typography.inter,
    color: '#ffffff',
    fontSize: fontSize.body,
    fontWeight: '600',
  },
});
