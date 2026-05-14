import { getDb } from './client'

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
    "SELECT value FROM settings WHERE key = 'tutorial_completed'"
  )
  if (existing) return

  const now = Date.now()
  const defaultFolders = [
    { id: crypto.randomUUID(), name: '未分類', iconId: 'default', isDefault: 1 },
    { id: crypto.randomUUID(), name: '仕事', iconId: 'work', isDefault: 0 },
    { id: crypto.randomUUID(), name: 'エンタメ', iconId: 'video', isDefault: 0 },
    { id: crypto.randomUUID(), name: 'ショッピング', iconId: 'shopping', isDefault: 0 },
    { id: crypto.randomUUID(), name: 'ニュース', iconId: 'news', isDefault: 0 },
  ]

  defaultFolders.forEach((f, i) => {
    db.runSync(
      'INSERT INTO folders (id, name, icon_id, sort_order, created_at, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [f.id, f.name, f.iconId, i, now, f.isDefault]
    )
  })

  db.runSync(
    'INSERT INTO bookmarks (id, folder_id, name, url, favicon_url, thumbnail_path, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [crypto.randomUUID(), defaultFolders[0].id, 'Google', 'https://google.com', null, null, 0, now]
  )

  const defaultSettings: Record<string, string> = {
    default_browser: 'safari',
    capture_thumbnail: 'true',
    grid_columns: '2',
    view_mode: 'grid',
    is_premium: 'false',
    tutorial_completed: 'false',
    last_selected_folder_id: defaultFolders[0].id,
  }
  Object.entries(defaultSettings).forEach(([key, value]) => {
    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
  })
}
