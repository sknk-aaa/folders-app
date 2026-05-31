import type { BackupStorage } from './types'
import { localBackupStorage } from './localStorage'

// 現在有効なバックアップ保存先。
// フェーズ2では、ここを iCloud 実装に差し替えるだけでよい。
export function getBackupStorage(): BackupStorage {
  return localBackupStorage
}

export type { BackupStorage, BackupManifest } from './types'
export { BACKUP_FORMAT_VERSION } from './types'
