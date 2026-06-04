import type { BackupStorage } from './types'
import { localBackupStorage } from './localStorage'
import { icloudBackupStorage } from './icloudStorage'

// 'icloud' is production. 'local' is for re-verifying logic (switchable in Metro).
const ACTIVE_BACKEND: 'icloud' | 'local' = 'icloud'

export function getBackupStorage(): BackupStorage {
  return ACTIVE_BACKEND === 'icloud' ? icloudBackupStorage : localBackupStorage
}

export type { BackupStorage, BackupManifest } from './types'
export { BACKUP_FORMAT_VERSION } from './types'
