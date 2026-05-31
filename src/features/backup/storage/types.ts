export const BACKUP_FORMAT_VERSION = 1

export type BackupManifest = {
  version: number
  createdAt: number
  bookmarkCount: number
  thumbnailCount: number
}

/**
 * バックアップ保存先の抽象。フェーズ1はローカルFS実装、フェーズ2でiCloud実装に差し替える。
 * relPath はバックアップルートからの相対パス（例: "folders.db" / "thumbnails/123.jpg"）。
 */
export interface BackupStorage {
  readonly label: string
  init(): Promise<void>
  /** ルート配下を空にする */
  clearAll(): Promise<void>
  /** ローカルの絶対URIのファイルを relPath へコピー */
  putFile(localUri: string, relPath: string): Promise<void>
  /** relPath のファイルをローカル絶対URI destUri へコピー */
  getFile(relPath: string, destUri: string): Promise<void>
  putText(relPath: string, text: string): Promise<void>
  getText(relPath: string): Promise<string | null>
  /** relDir 直下のファイル名一覧（存在しなければ []） */
  listFiles(relDir: string): Promise<string[]>
  exists(relPath: string): Promise<boolean>
}
