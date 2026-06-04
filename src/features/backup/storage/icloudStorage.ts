import * as FileSystem from 'expo-file-system/legacy'
import { CloudStorage } from 'react-native-cloud-storage'
import type { BackupStorage } from './types'

// AppData scope (default) = stored in a hidden area not visible to the user.
const ROOT = '/smb-backup'
const B64 = FileSystem.EncodingType.Base64

function join(rel: string): string {
  return rel ? `${ROOT}/${rel}` : ROOT
}

async function ensureDir(path: string): Promise<void> {
  if (!(await CloudStorage.exists(path))) {
    await CloudStorage.mkdir(path)
  }
}

async function ensureParent(fullPath: string): Promise<void> {
  const i = fullPath.lastIndexOf('/')
  if (i <= 0) return
  const parent = fullPath.slice(0, i)
  await ensureDir(ROOT)
  if (parent !== ROOT) await ensureDir(parent)
}

async function ensureLocalParent(uri: string): Promise<void> {
  const i = uri.lastIndexOf('/')
  if (i < 0) return
  await FileSystem.makeDirectoryAsync(uri.slice(0, i + 1), { intermediates: true })
}

export const icloudBackupStorage: BackupStorage = {
  label: 'iCloud',

  async init() {
    const available = await CloudStorage.isCloudAvailable()
    if (!available) {
      throw new Error('Please sign in to iCloud')
    }
    await ensureDir(ROOT)
  },

  async clearAll() {
    try {
      await CloudStorage.rmdir(ROOT, { recursive: true })
    } catch {
      // Ignore if it does not already exist
    }
    await ensureDir(ROOT)
  },

  async putFile(localUri, relPath) {
    const full = join(relPath)
    await ensureParent(full)
    const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: B64 })
    await CloudStorage.writeFile(full, b64)
  },

  async getFile(relPath, destUri) {
    const full = join(relPath)
    try {
      await CloudStorage.downloadFile(full)
    } catch {
      // Already present locally, etc. Retry with readFile
    }
    const b64 = await CloudStorage.readFile(full)
    await ensureLocalParent(destUri)
    await FileSystem.deleteAsync(destUri, { idempotent: true })
    await FileSystem.writeAsStringAsync(destUri, b64, { encoding: B64 })
  },

  async putText(relPath, text) {
    const full = join(relPath)
    await ensureParent(full)
    await CloudStorage.writeFile(full, text)
  },

  async getText(relPath) {
    const full = join(relPath)
    if (!(await CloudStorage.exists(full))) return null
    try {
      await CloudStorage.downloadFile(full)
    } catch {
      // ignore
    }
    try {
      return await CloudStorage.readFile(full)
    } catch {
      return null
    }
  },

  async listFiles(relDir) {
    const full = join(relDir)
    if (!(await CloudStorage.exists(full))) return []
    try {
      return await CloudStorage.readdir(full)
    } catch {
      return []
    }
  },

  async exists(relPath) {
    return CloudStorage.exists(join(relPath))
  },
}
