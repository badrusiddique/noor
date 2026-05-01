/**
 * SQLite client — web stub.
 *
 * `@op-engineering/op-sqlite` is a JSI-backed native module with no web
 * implementation. The full Mushaf reader is mobile-only by design (per
 * ADR-0003: op-sqlite primary, FTS5 always-on). The web target exists so
 * the home placeholder + theme + design-system iteration can run in a
 * browser; touching the database from web is a programming error.
 *
 * Metro picks this file when bundling for `Platform.OS === 'web'` because
 * of the `.web.ts` extension. The native client stays in `client.ts`.
 */
import { logger } from '@/lib/logger';

const MOBILE_ONLY_MESSAGE =
  'Noor Mushaf rendering is mobile-only. The bundled SQLite database (op-sqlite) ' +
  'has no web implementation. Run the iOS Simulator (`pnpm exec expo run:ios --simulator`) ' +
  'or install the Android dev client APK from `eas build --profile development --platform android`. ' +
  'See README "How to run" for details.';

export type DB = never;

export function getDb(): Promise<DB> {
  logger.warn('[db] getDb() called on web — Mushaf is mobile-only');
  return Promise.reject(new Error(MOBILE_ONLY_MESSAGE));
}

/** Test-only: parity with the native module so consumers compile uniformly. */
export function __resetDbForTests(): void {
  // no-op on web
}
