import * as FileSystem from 'expo-file-system/legacy'
import { getDb, closeDb, DB_NAME } from '../../shared/db/client'
import { useSettingsStore } from '../settings/store'
import { useFoldersStore } from '../folders/store'
import { useBookmarksStore } from '../bookmarks/store'
import type { BackupStorage, BackupManifest } from './storage/types'
import { BACKUP_FORMAT_VERSION } from './storage/types'
import { tr } from '../../shared/i18n'

const DOC = FileSystem.documentDirectory
const DB_DIR = `${DOC}SQLite/`
const DB_PATH = `${DB_DIR}${DB_NAME}`
const THUMB_DIR = `${DOC}thumbnails/`
const SAFETY_DIR = `${DOC}__restore_safety__/`

const REL_DB = 'folders.db'
const REL_THUMBS = 'thumbnails'
const REL_MANIFEST = 'manifest.json'

// SQLite WAL/SHM side files
const DB_SIDE_FILES = [`${DB_PATH}-wal`, `${DB_PATH}-shm`]

function basename(p: string): string {
  const i = p.lastIndexOf('/')
  return i >= 0 ? p.slice(i + 1) : p
}

async function listThumbnailFiles(): Promise<string[]> {
  try {
    return await FileSystem.readDirectoryAsync(THUMB_DIR)
  } catch {
    return []
  }
}

function reloadStores(): void {
  useSettingsStore.getState().load()
  useFoldersStore.getState().load()
  useBookmarksStore.getState().load()
}

/** Fold the WAL into the main DB file (bring the main file to a complete state before backup) */
function checkpointWal(): void {
  try {
    getDb().execSync('PRAGMA wal_checkpoint(TRUNCATE);')
  } catch {
    // Not fatal even if it fails (e.g. WAL not in use)
  }
}

export async function runBackup(storage: BackupStorage): Promise<BackupManifest> {
  await storage.init()
  checkpointWal()
  await storage.clearAll()

  // Main DB
  await storage.putFile(DB_PATH, REL_DB)

  // All thumbnails
  const thumbs = await listThumbnailFiles()
  for (const name of thumbs) {
    await storage.putFile(`${THUMB_DIR}${name}`, `${REL_THUMBS}/${name}`)
  }

  const bookmarkCount =
    getDb().getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM bookmarks')?.c ?? 0

  const manifest: BackupManifest = {
    version: BACKUP_FORMAT_VERSION,
    createdAt: Date.now(),
    bookmarkCount,
    thumbnailCount: thumbs.length,
  }
  await storage.putText(REL_MANIFEST, JSON.stringify(manifest))

  useSettingsStore.getState().set('last_backup_at', manifest.createdAt)
  return manifest
}

export async function readManifest(storage: BackupStorage): Promise<BackupManifest | null> {
  const raw = await storage.getText(REL_MANIFEST)
  if (!raw) return null
  try {
    return JSON.parse(raw) as BackupManifest
  } catch {
    return null
  }
}

/** Save the current DB and thumbnails locally before restore (for rollback on failure) */
async function snapshotCurrent(): Promise<void> {
  await FileSystem.deleteAsync(SAFETY_DIR, { idempotent: true })
  await FileSystem.makeDirectoryAsync(`${SAFETY_DIR}thumbnails/`, { intermediates: true })
  const dbInfo = await FileSystem.getInfoAsync(DB_PATH)
  if (dbInfo.exists) {
    await FileSystem.copyAsync({ from: DB_PATH, to: `${SAFETY_DIR}${REL_DB}` })
  }
  for (const name of await listThumbnailFiles()) {
    await FileSystem.copyAsync({ from: `${THUMB_DIR}${name}`, to: `${SAFETY_DIR}thumbnails/${name}` })
  }
}

async function rollbackFromSnapshot(): Promise<void> {
  closeDb()
  await deleteDbFiles()
  const savedDb = await FileSystem.getInfoAsync(`${SAFETY_DIR}${REL_DB}`)
  if (savedDb.exists) {
    await FileSystem.copyAsync({ from: `${SAFETY_DIR}${REL_DB}`, to: DB_PATH })
  }
  await FileSystem.deleteAsync(THUMB_DIR, { idempotent: true })
  await FileSystem.makeDirectoryAsync(THUMB_DIR, { intermediates: true })
  let savedThumbs: string[] = []
  try {
    savedThumbs = await FileSystem.readDirectoryAsync(`${SAFETY_DIR}thumbnails/`)
  } catch {
    savedThumbs = []
  }
  for (const name of savedThumbs) {
    await FileSystem.copyAsync({ from: `${SAFETY_DIR}thumbnails/${name}`, to: `${THUMB_DIR}${name}` })
  }
  getDb()
  reloadStores()
}

async function deleteDbFiles(): Promise<void> {
  await FileSystem.deleteAsync(DB_PATH, { idempotent: true })
  for (const f of DB_SIDE_FILES) {
    await FileSystem.deleteAsync(f, { idempotent: true })
  }
}

/**
 * Restore: overwrite local data with the DB and thumbnails from the backup destination.
 * Thumbnail absolute paths differ per device, so rewrite them to the current documentDirectory after restore.
 */
export async function runRestore(storage: BackupStorage): Promise<BackupManifest> {
  await storage.init()
  const manifest = await readManifest(storage)
  if (!manifest) {
    throw new Error(tr({ en: 'No backup found', ja: 'バックアップが見つかりません' }))
  }

  await snapshotCurrent()

  try {
    // Replace DB
    closeDb()
    await deleteDbFiles()
    await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true })
    await storage.getFile(REL_DB, DB_PATH)

    // Replace thumbnails
    await FileSystem.deleteAsync(THUMB_DIR, { idempotent: true })
    await FileSystem.makeDirectoryAsync(THUMB_DIR, { intermediates: true })
    for (const name of await storage.listFiles(REL_THUMBS)) {
      await storage.getFile(`${REL_THUMBS}/${name}`, `${THUMB_DIR}${name}`)
    }

    // Reopen and rewrite thumbnail absolute paths for the current device
    const db = getDb()
    const rows = db.getAllSync<{ id: string; thumbnail_path: string | null }>(
      'SELECT id, thumbnail_path FROM bookmarks WHERE thumbnail_path IS NOT NULL',
    )
    for (const row of rows) {
      if (!row.thumbnail_path) continue
      const fixed = `${THUMB_DIR}${basename(row.thumbnail_path)}`
      if (fixed !== row.thumbnail_path) {
        db.runSync('UPDATE bookmarks SET thumbnail_path = ? WHERE id = ?', [fixed, row.id])
      }
    }

    reloadStores()
    return manifest
  } catch (e) {
    // On failure, restore from the snapshot
    try {
      await rollbackFromSnapshot()
    } catch {
      // If the rollback also fails, rethrow as-is
    }
    throw e
  }
}
