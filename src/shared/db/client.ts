import * as SQLite from 'expo-sqlite'

export const DB_NAME = 'folders.db'

let _db: SQLite.SQLiteDatabase | null = null

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME)
  }
  return _db
}

// 復元時にDBファイルを差し替えるため、開いている接続を閉じる。
// 次回 getDb() で再オープンされる。
export function closeDb(): void {
  if (_db) {
    _db.closeSync()
    _db = null
  }
}
