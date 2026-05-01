import '@testing-library/jest-native/extend-expect';

// Silence noisy warnings during tests
jest.mock('expo-font', () => ({
  useFonts: () => [true],
  loadAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
}));
