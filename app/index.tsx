import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const version = (Constants.expoConfig?.version as string | undefined) ?? '0.1.0';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.brand}>Noor</Text>
        <Text style={styles.version}>v{version}</Text>
        <View style={styles.divider} />
        <Text style={styles.title}>Phase 0 — Bootstrap</Text>
        <Text style={styles.body}>Phase 2 will replace this with the Mushaf reader.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f3ec' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brand: {
    fontSize: 48,
    fontWeight: '600',
    color: '#1a1410',
    letterSpacing: -1,
  },
  version: {
    fontSize: 14,
    color: '#7a6f63',
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: 64,
    backgroundColor: '#d4c8b4',
    marginVertical: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1410',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#5a5147',
    textAlign: 'center',
    lineHeight: 20,
  },
});
