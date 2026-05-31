import type { BackupStorage } from './types'
import { localBackupStorage } from './localStorage'
import { icloudBackupStorage } from './icloudStorage'

// 'icloud' が本番。'local' はロジック再検証用（Metroで切り替えられる）。
const ACTIVE_BACKEND: 'icloud' | 'local' = 'icloud'

export function getBackupStorage(): BackupStorage {
  return ACTIVE_BACKEND === 'icloud' ? icloudBackupStorage : localBackupStorage
}

export type { BackupStorage, BackupManifest } from './types'
export { BACKUP_FORMAT_VERSION } from './types'
