-- Noor canonical SQLite schema (FTS5 required)
-- Phase 1 build script (`scripts/build-db.ts`) will execute this against a fresh
-- better-sqlite3 database to produce `assets/db/quran.db`. The runtime app then
-- copies this DB into `documentDirectory/` and applies WAL on open.

PRAGMA foreign_keys = ON;
PRAGMA user_version = 1;

-- =====================================================================
-- Static corpus (read-only at runtime, baked into the bundled DB)
-- =====================================================================

CREATE TABLE surahs (
  number              INTEGER PRIMARY KEY,
  name_ar             TEXT NOT NULL,
  name_en             TEXT NOT NULL,
  name_translit       TEXT NOT NULL,
  revelation_place    TEXT NOT NULL CHECK (revelation_place IN ('makkah','madinah')),
  ayah_count          INTEGER NOT NULL,
  juz_start           INTEGER NOT NULL,
  page_start          INTEGER NOT NULL
);

CREATE TABLE verses (
  id              INTEGER PRIMARY KEY,
  surah_no        INTEGER NOT NULL REFERENCES surahs(number),
  ayah_no         INTEGER NOT NULL,
  page_no         INTEGER NOT NULL,
  line_no         INTEGER NOT NULL,
  juz_no          INTEGER NOT NULL,
  hizb_no         INTEGER NOT NULL,
  ruku_no         INTEGER NOT NULL,
  manzil_no       INTEGER NOT NULL,
  sajdah_flag     INTEGER NOT NULL DEFAULT 0,
  text_uthmani    TEXT NOT NULL,
  text_indopak    TEXT NOT NULL,
  transliteration TEXT,
  UNIQUE(surah_no, ayah_no)
);

CREATE INDEX idx_verses_page  ON verses(page_no, line_no);
CREATE INDEX idx_verses_juz   ON verses(juz_no);
CREATE INDEX idx_verses_surah ON verses(surah_no, ayah_no);
CREATE INDEX idx_verses_ruku  ON verses(ruku_no);

CREATE TABLE words (
  verse_id        INTEGER NOT NULL REFERENCES verses(id),
  position        INTEGER NOT NULL,
  text            TEXT NOT NULL,
  transliteration TEXT,
  PRIMARY KEY (verse_id, position)
) WITHOUT ROWID;

CREATE INDEX idx_words_verse ON words(verse_id);

CREATE TABLE pages (
  page_no                 INTEGER PRIMARY KEY,
  juz_no                  INTEGER NOT NULL,
  hizb_no                 INTEGER NOT NULL,
  surah_starts_on_page    TEXT NOT NULL,
  rukus_on_page           TEXT NOT NULL
);

CREATE INDEX idx_pages_juz ON pages(juz_no);

-- =====================================================================
-- Translations (read-only)
-- =====================================================================

CREATE TABLE translations (
  id              INTEGER PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  scholar_name    TEXT NOT NULL,
  scholar_name_ar TEXT,
  language        TEXT NOT NULL,
  license_note    TEXT NOT NULL
);

CREATE TABLE verse_translations (
  verse_id        INTEGER NOT NULL REFERENCES verses(id),
  translation_id  INTEGER NOT NULL REFERENCES translations(id),
  text            TEXT NOT NULL,
  PRIMARY KEY (verse_id, translation_id)
) WITHOUT ROWID;

CREATE INDEX idx_vtrans_translation ON verse_translations(translation_id);

-- =====================================================================
-- Full-text search (FTS5)
-- =====================================================================

CREATE VIRTUAL TABLE verses_fts USING fts5(
  text_uthmani,
  text_indopak,
  transliteration,
  content='verses',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER verses_ai AFTER INSERT ON verses BEGIN
  INSERT INTO verses_fts(rowid, text_uthmani, text_indopak, transliteration)
  VALUES (new.id, new.text_uthmani, new.text_indopak, new.transliteration);
END;

CREATE TRIGGER verses_ad AFTER DELETE ON verses BEGIN
  INSERT INTO verses_fts(verses_fts, rowid, text_uthmani, text_indopak, transliteration)
  VALUES ('delete', old.id, old.text_uthmani, old.text_indopak, old.transliteration);
END;

CREATE TRIGGER verses_au AFTER UPDATE ON verses BEGIN
  INSERT INTO verses_fts(verses_fts, rowid, text_uthmani, text_indopak, transliteration)
  VALUES ('delete', old.id, old.text_uthmani, old.text_indopak, old.transliteration);
  INSERT INTO verses_fts(rowid, text_uthmani, text_indopak, transliteration)
  VALUES (new.id, new.text_uthmani, new.text_indopak, new.transliteration);
END;

CREATE VIRTUAL TABLE verse_translations_fts USING fts5(
  text,
  content='verse_translations',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

-- =====================================================================
-- User data (read/write at runtime, sync-ready via sync_id)
-- =====================================================================

CREATE TABLE bookmark_collections (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  color       TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  sync_id     TEXT UNIQUE
);

CREATE TABLE bookmarks (
  id            INTEGER PRIMARY KEY,
  verse_id      INTEGER NOT NULL REFERENCES verses(id),
  collection_id INTEGER REFERENCES bookmark_collections(id) ON DELETE SET NULL,
  color         TEXT NOT NULL DEFAULT 'default',
  note          TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  sync_id       TEXT UNIQUE
);
CREATE INDEX idx_bookmarks_verse      ON bookmarks(verse_id);
CREATE INDEX idx_bookmarks_collection ON bookmarks(collection_id);
CREATE INDEX idx_bookmarks_updated    ON bookmarks(updated_at);

CREATE TABLE highlights (
  id          INTEGER PRIMARY KEY,
  verse_id    INTEGER NOT NULL REFERENCES verses(id),
  color       TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  sync_id     TEXT UNIQUE
);
CREATE INDEX idx_highlights_verse ON highlights(verse_id);

CREATE TABLE notes (
  id          INTEGER PRIMARY KEY,
  verse_id    INTEGER NOT NULL REFERENCES verses(id),
  body        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  sync_id     TEXT UNIQUE
);
CREATE INDEX idx_notes_verse ON notes(verse_id);

CREATE TABLE history (
  id                INTEGER PRIMARY KEY,
  page_no           INTEGER NOT NULL,
  surah_no          INTEGER NOT NULL,
  ayah_no           INTEGER NOT NULL,
  opened_at         INTEGER NOT NULL,
  duration_seconds  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_history_opened ON history(opened_at DESC);

CREATE TABLE last_read (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  page_no       INTEGER NOT NULL,
  surah_no      INTEGER NOT NULL,
  ayah_no       INTEGER NOT NULL,
  scroll_offset REAL NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL
);
INSERT OR IGNORE INTO last_read (id, page_no, surah_no, ayah_no, scroll_offset, updated_at)
VALUES (1, 1, 1, 1, 0, 0);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- =====================================================================
-- Audio
-- =====================================================================

CREATE TABLE recitations (
  id                    INTEGER PRIMARY KEY,
  code                  TEXT NOT NULL UNIQUE,
  reciter_name          TEXT NOT NULL,
  reciter_name_ar       TEXT,
  base_urls             TEXT NOT NULL,
  supports_word_timing  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE audio_cache (
  verse_id        INTEGER NOT NULL REFERENCES verses(id),
  recitation_id   INTEGER NOT NULL REFERENCES recitations(id),
  local_path      TEXT NOT NULL,
  file_size       INTEGER NOT NULL,
  downloaded_at   INTEGER NOT NULL,
  PRIMARY KEY (verse_id, recitation_id)
) WITHOUT ROWID;
CREATE INDEX idx_audio_cache_recitation ON audio_cache(recitation_id);
CREATE INDEX idx_audio_cache_downloaded ON audio_cache(downloaded_at);

-- Seed reciters (multi-CDN base_urls as JSON array).
INSERT INTO recitations (id, code, reciter_name, reciter_name_ar, base_urls, supports_word_timing) VALUES
  (1, 'alafasy_64', 'Mishary Rashid Alafasy', 'مشاري بن راشد العفاسي',
   '["https://everyayah.com/data/Alafasy_64kbps/","https://download.quranicaudio.com/qdc/mishary_al_afasy/murattal/"]', 1),
  (2, 'saadalghamdi_40', 'Saad Al-Ghamdi', 'سعد الغامدي',
   '["https://everyayah.com/data/Ghamadi_40kbps/","https://download.quranicaudio.com/qdc/saad_al_ghamdi/murattal/"]', 0),
  (3, 'abdulbasit_mujawwad_64', 'Abdul Basit Abdul Samad (Mujawwad)', 'عبد الباسط عبد الصمد',
   '["https://everyayah.com/data/Abdul_Basit_Mujawwad_64kbps/","https://download.quranicaudio.com/qdc/abdul_basit/mujawwad/"]', 0);
