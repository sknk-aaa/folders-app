import { getDb } from './client'
import { createId } from '../utils/id'
import { MOCK_BOOKMARKS, MOCK_FOLDERS } from '../mockVisuals'

const CURRENT_MOCK_SEED_VERSION = '7'

export function migrateSchema(): void {
  const db = getDb()
  const hasPinCode = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pragma_table_info('folders') WHERE name='pin_code'",
  )?.count ?? 0
  if (!hasPinCode) {
    db.execSync('ALTER TABLE folders ADD COLUMN pin_code TEXT')
  }
  const hasCustomThumb = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pragma_table_info('folders') WHERE name='custom_thumbnail_path'",
  )?.count ?? 0
  if (!hasCustomThumb) {
    db.execSync('ALTER TABLE folders ADD COLUMN custom_thumbnail_path TEXT')
  }
  const hasMemo = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pragma_table_info('bookmarks') WHERE name='memo'",
  )?.count ?? 0
  if (!hasMemo) {
    db.execSync('ALTER TABLE bookmarks ADD COLUMN memo TEXT')
  }
  const hasViewedAt = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pragma_table_info('bookmarks') WHERE name='viewed_at'",
  )?.count ?? 0
  if (!hasViewedAt) {
    db.execSync('ALTER TABLE bookmarks ADD COLUMN viewed_at INTEGER')
  }
}

export function initializeDatabase(): void {
  const db = getDb()
  db.execSync(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon_id TEXT NOT NULL DEFAULT 'default',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      pin_code TEXT,
      custom_thumbnail_path TEXT
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
      memo TEXT,
      viewed_at INTEGER,
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
    home_mock_seed_version: CURRENT_MOCK_SEED_VERSION,
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

  // Lookup of folder name -> id
  const folderIdByName = Object.fromEntries(defaultFolders.map((f) => [f.name, f.id]))

  // Reassign sort_order starting from 0 per folder
  const sortOrderByFolder = new Map<string, number>()

  MOCK_BOOKMARKS.forEach((bookmark, i) => {
    const folderId = folderIdByName[bookmark.folderName]
    if (!folderId) return
    const order = sortOrderByFolder.get(folderId) ?? 0
    sortOrderByFolder.set(folderId, order + 1)

    db.runSync(
      'INSERT INTO bookmarks (id, folder_id, name, url, favicon_url, thumbnail_path, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        createId(),
        folderId,
        bookmark.name,
        bookmark.url,
        null,
        bookmark.thumbnailPath,
        order,
        now - i,
      ],
    )
  })

  return defaultFolders
}

function migrateLegacyDefaultData(): void {
  const db = getDb()
  const seedVersion = db.getFirstSync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'home_mock_seed_version'",
  )?.value

  if (seedVersion === CURRENT_MOCK_SEED_VERSION) return

  // Migration from v1-v6 to v7 (re-seed if the mock data is unedited)
  if (
    seedVersion === '1' ||
    seedVersion === '2' ||
    seedVersion === '3' ||
    seedVersion === '4' ||
    seedVersion === '5' ||
    seedVersion === '6'
  ) {
    // Check whether the mock data is untouched (folder names match + all bookmarks are picsum or images.unsplash)
    const folders = db.getAllSync<{ name: string }>(
      'SELECT name FROM folders ORDER BY sort_order ASC',
    )
    const expectedNames = MOCK_FOLDERS.map((f) => f.name)
    const isFolderUntouched =
      folders.length === expectedNames.length &&
      folders.every((f, i) => f.name === expectedNames[i])

    const customCount = db.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM bookmarks
       WHERE thumbnail_path NOT LIKE 'https://picsum.photos%'
         AND thumbnail_path NOT LIKE 'https://images.unsplash.com%'`,
    )

    const isUntouched = isFolderUntouched && (customCount?.count ?? 1) === 0

    if (isUntouched) {
      db.execSync(`DELETE FROM bookmarks; DELETE FROM folders;`)
      const defaultFolders = insertMockFoldersAndBookmarks(Date.now())
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        'last_selected_folder_id',
        defaultFolders[0].id,
      ])
    }

    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'home_mock_seed_version',
      CURRENT_MOCK_SEED_VERSION,
    ])
    return
  }

  // Initial migration from pre-v1 legacy data (5 folders, 1 or fewer bookmarks)
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
      CURRENT_MOCK_SEED_VERSION,
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
    CURRENT_MOCK_SEED_VERSION,
  ])
}
