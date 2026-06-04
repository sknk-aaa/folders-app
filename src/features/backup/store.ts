import { create } from 'zustand'
import { getBackupStorage } from './storage'
import { runBackup, runRestore } from './engine'
import type { BackupManifest } from './storage/types'

type BackupState = 'idle' | 'backing-up' | 'restoring'

type BackupStore = {
  state: BackupState
  backup: () => Promise<{ ok: boolean; error?: string; manifest?: BackupManifest }>
  restore: () => Promise<{ ok: boolean; error?: string; manifest?: BackupManifest }>
}

export const useBackupStore = create<BackupStore>((set, get) => ({
  state: 'idle',

  backup: async () => {
    if (get().state !== 'idle') return { ok: false, error: 'Processing in progress' }
    set({ state: 'backing-up' })
    try {
      const manifest = await runBackup(getBackupStorage())
      return { ok: true, manifest }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Backup failed' }
    } finally {
      set({ state: 'idle' })
    }
  },

  restore: async () => {
    if (get().state !== 'idle') return { ok: false, error: 'Processing in progress' }
    set({ state: 'restoring' })
    try {
      const manifest = await runRestore(getBackupStorage())
      return { ok: true, manifest }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Restore failed' }
    } finally {
      set({ state: 'idle' })
    }
  },
}))
