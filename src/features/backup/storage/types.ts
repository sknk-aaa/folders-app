export const BACKUP_FORMAT_VERSION = 1

export type BackupManifest = {
  version: number
  createdAt: number
  bookmarkCount: number
  thumbnailCount: number
}

/**
 * Abstraction of the backup destination. Phase 1 uses a local FS implementation,
 * which is swapped for the iCloud implementation in phase 2.
 * relPath is the path relative to the backup root (e.g. "folders.db" / "thumbnails/123.jpg").
 */
export interface BackupStorage {
  readonly label: string
  init(): Promise<void>
  /** Empty everything under the root */
  clearAll(): Promise<void>
  /** Copy the file at the local absolute URI to relPath */
  putFile(localUri: string, relPath: string): Promise<void>
  /** Copy the file at relPath to the local absolute URI destUri */
  getFile(relPath: string, destUri: string): Promise<void>
  putText(relPath: string, text: string): Promise<void>
  getText(relPath: string): Promise<string | null>
  /** List of file names directly under relDir (empty array if it does not exist) */
  listFiles(relDir: string): Promise<string[]>
  exists(relPath: string): Promise<boolean>
}
