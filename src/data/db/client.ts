/**
 * SQLite client — opens the bundled `assets/db/quran.db` via op-sqlite.
 *
 * On iOS/Android the bundled DB ships in the app bundle but is read-only at
 * its asset path. To open it in WAL mode we copy it once into
 * `FileSystem.documentDirectory` on first launch, then cache the handle.
 *
 * Phase 2 alpha: the schema is read-only for the Mushaf reader (verses,
 * surahs, pages). User-mutable tables (bookmarks, history, notes...) come
 * online in Phase 4 — they share this same handle.
 */

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { open, type DB } from '@op-engineering/op-sqlite';

import { logger } from '@/lib/logger';

const DB_FILENAME = 'quran.db';

let dbInstance: DB | null = null;
let openPromise: Promise<DB> | null = null;

/**
 * Lazily opens the SQLite handle. Safe to call from many places — the
 * heavy work runs once and subsequent callers receive the cached handle.
 */
export function getDb(): Promise<DB> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (openPromise) return openPromise;

  openPromise = bootstrap().then((db) => {
    dbInstance = db;
    return db;
  });
  return openPromise;
}

async function bootstrap(): Promise<DB> {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    throw new Error('FileSystem.documentDirectory unavailable on this platform');
  }

  const targetUri = `${docDir}${DB_FILENAME}`;
  const targetPath = uriToPath(targetUri);

  const info = await FileSystem.getInfoAsync(targetUri);
  if (!info.exists || info.size === 0) {
    // First launch (or a corrupt copy): pull the bundled asset and copy it
    // into the document directory so SQLite can open it read/write.
    const asset = Asset.fromModule(require('@assets/db/quran.db') as number);
    await asset.downloadAsync();
    if (!asset.localUri) {
      throw new Error('Bundled quran.db asset has no localUri after downloadAsync');
    }
    await FileSystem.copyAsync({ from: asset.localUri, to: targetUri });
    logger.info('[db] copied bundled quran.db to', targetUri);
  }

  // op-sqlite expects a path (no `file://` prefix) and a `location`
  // directory. We pass the absolute path with `location` set to the
  // document directory so iOS + Android both resolve it identically.
  const db = open({
    name: DB_FILENAME,
    location: stripScheme(docDir),
  });

  // WAL + a generous page cache. PRAGMA cache_size negative = KiB, so
  // -8000 = 8 MiB, matching the perf budget in plan §5.7. Synchronous so
  // every subsequent query sees the pragma in effect.
  db.executeSync('PRAGMA journal_mode = WAL;');
  db.executeSync('PRAGMA cache_size = -8000;');
  db.executeSync('PRAGMA foreign_keys = ON;');

  // Pre-warm the indices so the first user-facing query doesn't pay
  // a cold disk hit (per plan §5.7).
  db.executeSync('SELECT 1 FROM verses WHERE id = 1;');

  logger.info('[db] opened', targetPath, 'in WAL mode');
  return db;
}

function uriToPath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

function stripScheme(uri: string): string {
  const path = uriToPath(uri);
  // op-sqlite wants the directory without trailing slash on iOS.
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * Test-only: reset the cached handle. Never call from app code.
 *
 * @internal
 */
export function __resetDbForTests(): void {
  dbInstance = null;
  openPromise = null;
}
