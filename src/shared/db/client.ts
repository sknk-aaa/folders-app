import * as SQLite from 'expo-sqlite'

export const DB_NAME = 'folders.db'

let _db: SQLite.SQLiteDatabase | null = null

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME)
  }
  return _db
}

// Closes the open connection so the DB file can be swapped during restore.
// It will be reopened on the next getDb() call.
export function closeDb(): void {
  if (_db) {
    _db.closeSync()
    _db = null
  }
}
