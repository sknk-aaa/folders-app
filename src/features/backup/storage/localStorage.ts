import * as FileSystem from 'expo-file-system/legacy'
import type { BackupStorage } from './types'

// "Fake cloud" for phase 1 verification. Writes to a separate local directory.
// In phase 2 this implementation is swapped for the iCloud implementation (engine side unchanged).
const ROOT = `${FileSystem.documentDirectory}__local_backup__/`

function abs(relPath: string): string {
  return ROOT + relPath
}

async function ensureParentDir(uri: string): Promise<void> {
  const dir = uri.slice(0, uri.lastIndexOf('/') + 1)
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
}

export const localBackupStorage: BackupStorage = {
  label: 'Local (for verification)',

  async init() {
    await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true })
  },

  async clearAll() {
    await FileSystem.deleteAsync(ROOT, { idempotent: true })
    await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true })
  },

  async putFile(localUri, relPath) {
    const dest = abs(relPath)
    await ensureParentDir(dest)
    await FileSystem.deleteAsync(dest, { idempotent: true })
    await FileSystem.copyAsync({ from: localUri, to: dest })
  },

  async getFile(relPath, destUri) {
    await ensureParentDir(destUri)
    await FileSystem.deleteAsync(destUri, { idempotent: true })
    await FileSystem.copyAsync({ from: abs(relPath), to: destUri })
  },

  async putText(relPath, text) {
    const dest = abs(relPath)
    await ensureParentDir(dest)
    await FileSystem.writeAsStringAsync(dest, text)
  },

  async getText(relPath) {
    try {
      return await FileSystem.readAsStringAsync(abs(relPath))
    } catch {
      return null
    }
  },

  async listFiles(relDir) {
    try {
      const dir = relDir ? abs(relDir) : ROOT
      return await FileSystem.readDirectoryAsync(dir)
    } catch {
      return []
    }
  },

  async exists(relPath) {
    const info = await FileSystem.getInfoAsync(abs(relPath))
    return info.exists
  },
}
