import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/theme/ThemeProvider';
import { initI18n } from '@/i18n';

// Keep the splash screen visible while we bootstrap fonts, i18n, and DB.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    // Arabic Mushaf — Plan B: Amiri Quran (SIL OFL 1.1, alif-type/amiri).
    // Dedicated Quran typesetting font; closer to printed Mushaf style than
    // Scheherazade New. GDEF + GPOS tables provide full Arabic shaping.
    // Plan A (KFGQPC IndoPak) replaces this when a licensed mirror is found.
    AmiriQuran: require('../assets/fonts/AmiriQuran.ttf'),
    // Arabic Mushaf — Plan C fallback (Scheherazade New, SIL OFL 1.1).
    ScheherazadeNew: require('../assets/fonts/ScheherazadeNew-Regular.ttf'),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initI18n();
      } finally {
        if (!cancelled) setI18nReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = i18nReady && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <View style={styles.container}>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#f7f3ec' },
                }}
              />
            </View>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f3ec' },
  container: { flex: 1, backgroundColor: '#f7f3ec' },
});
