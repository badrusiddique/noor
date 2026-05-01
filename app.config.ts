import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Noor',
  slug: 'noor',
  version: '0.1.0',
  scheme: 'noor',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    // Brand navy from the icon backdrop, so launch -> splash -> first
    // frame stays visually continuous instead of flashing parchment under
    // the dark-themed icon during the resize fit.
    backgroundColor: '#131f2a',
  },
  assetBundlePatterns: ['assets/fonts/*', 'assets/db/*', 'assets/audio/**/*', 'assets/images/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.noor.quran',
    infoPlist: {
      UIBackgroundModes: ['audio'],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'app.noor.quran',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      // Matches the icon backdrop so Android's circular/squircle masks
      // don't reveal a parchment edge around the rendered logo.
      backgroundColor: '#131f2a',
    },
    permissions: [],
  },
  web: {
    favicon: './assets/images/favicon.png',
    bundler: 'metro',
  },
  plugins: ['expo-router', 'expo-font', 'expo-localization'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
  },
};

export default config;
