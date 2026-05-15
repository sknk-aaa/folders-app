import { getDb } from './client'
import { createId } from '../utils/id'
import { MOCK_BOOKMARKS, MOCK_FOLDERS } from '../mockVisuals'

export function initializeDatabase(): void {
  const db = getDb()
  db.execSync(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon_id TEXT NOT NULL DEFAULT 'default',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      folder_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      favicon_url TEXT,
      thumbnail_path TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (folder_id) REFERENCES folders(id)
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

export function seedDefaultData(): void {
  const db = getDb()

  const existing = db.getFirstSync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'tutorial_completed'",
  )
  if (existing) {
    migrateLegacyDefaultData()
    return
  }

  const now = Date.now()
  const defaultFolders = insertMockFoldersAndBookmarks(now)

  const defaultSettings: Record<string, string> = {
    default_browser: 'safari',
    capture_thumbnail: 'true',
    grid_columns: '2',
    view_mode: 'grid',
    is_premium: 'false',
    tutorial_completed: 'false',
    last_selected_folder_id: defaultFolders[0].id,
    home_mock_seed_version: '1',
  }
  Object.entries(defaultSettings).forEach(([key, value]) => {
    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
  })
}

function insertMockFoldersAndBookmarks(now: number) {
  const db = getDb()
  const defaultFolders = MOCK_FOLDERS.map((folder) => ({ ...folder, id: createId() }))

  defaultFolders.forEach((f, i) => {
    db.runSync(
      'INSERT INTO folders (id, name, icon_id, sort_order, created_at, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [f.id, f.name, f.iconId, i, now, f.isDefault],
    )
  })

  MOCK_BOOKMARKS.forEach((bookmark, i) => {
    db.runSync(
      'INSERT INTO bookmarks (id, folder_id, name, url, favicon_url, thumbnail_path, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        createId(),
        defaultFolders[i % defaultFolders.length].id,
        bookmark.name,
        bookmark.url,
        null,
        bookmark.thumbnailPath,
        i,
        now - i,
      ],
    )
  })

  return defaultFolders
}

function migrateLegacyDefaultData(): void {
  const db = getDb()
  const migrated = db.getFirstSync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'home_mock_seed_version'",
  )
  if (migrated) return

  const folders = db.getAllSync<{ name: string }>(
    'SELECT name FROM folders ORDER BY sort_order ASC',
  )
  const bookmarkCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM bookmarks',
  )
  const legacyNames = ['未分類', '仕事', 'エンタメ', 'ショッピング', 'ニュース']
  const isUntouchedLegacySeed =
    folders.length === legacyNames.length &&
    (bookmarkCount?.count ?? 0) <= 1 &&
    legacyNames.every((name, i) => folders[i]?.name === name)

  if (!isUntouchedLegacySeed) {
    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'home_mock_seed_version',
      '1',
    ])
    return
  }

  db.execSync(`
    DELETE FROM bookmarks;
    DELETE FROM folders;
  `)

  const defaultFolders = insertMockFoldersAndBookmarks(Date.now())
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    'last_selected_folder_id',
    defaultFolders[0].id,
  ])
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    'home_mock_seed_version',
    '1',
  ])
}
