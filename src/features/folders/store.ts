import { create } from 'zustand'
import { getDb } from '../../shared/db/client'
import { createId } from '../../shared/utils/id'
import { setFolders as setSharedFolders } from '../../shared/storage/sharedStorage'
import { deleteFolderThumbnail } from '../../shared/utils/folderThumbnail'
import { useUnlockStore } from './unlockStore'
import { useBookmarksStore } from '../bookmarks/store'
import { useSettingsStore } from '../settings/store'
import type { Folder, FolderIconId } from '../../shared/types'

function syncToShared(folders: Folder[]) {
  setSharedFolders(
    folders.map((f) => ({ id: f.id, name: f.name, sortOrder: f.sortOrder })),
  )
}

type FoldersStore = {
  folders: Folder[]
  load: () => void
  add: (name: string, iconId: FolderIconId) => Folder
  update: (id: string, name: string, iconId: FolderIconId) => void
  remove: (id: string) => void
  reorder: (folders: Folder[]) => void
  setPin: (id: string, pin: string) => void
  removePin: (id: string) => void
  setCustomThumbnail: (id: string, path: string) => void
  removeCustomThumbnail: (id: string) => Promise<void>
}

function toFolder(row: Record<string, unknown>): Folder {
  return {
    id: row.id as string,
    name: row.name as string,
    iconId: row.icon_id as FolderIconId,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as number,
    isDefault: row.is_default as number,
    pinCode: (row.pin_code as string | null) ?? null,
    customThumbnailPath: (row.custom_thumbnail_path as string | null) ?? null,
  }
}

export const useFoldersStore = create<FoldersStore>((setState, getState) => ({
  folders: [],

  load: () => {
    const db = getDb()
    const rows = db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM folders ORDER BY sort_order ASC',
    )
    const folders = rows.map(toFolder)
    setState({ folders })
    syncToShared(folders)
  },

  add: (name, iconId) => {
    const db = getDb()
    const id = createId()
    const now = Date.now()
    const maxOrder = getState().folders.reduce((m, f) => Math.max(m, f.sortOrder), -1)
    db.runSync(
      'INSERT INTO folders (id, name, icon_id, sort_order, created_at, is_default) VALUES (?, ?, ?, ?, ?, 0)',
      [id, name, iconId, maxOrder + 1, now],
    )
    const folder: Folder = {
      id,
      name,
      iconId,
      sortOrder: maxOrder + 1,
      createdAt: now,
      isDefault: 0,
      pinCode: null,
      customThumbnailPath: null,
    }
    setState((s) => ({ folders: [...s.folders, folder] }))
    syncToShared(getState().folders)
    return folder
  },

  update: (id, name, iconId) => {
    const db = getDb()
    db.runSync('UPDATE folders SET name = ?, icon_id = ? WHERE id = ?', [name, iconId, id])
    setState((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, name, iconId } : f)),
    }))
    syncToShared(getState().folders)
  },

  remove: (id) => {
    const db = getDb()
    const target = getState().folders.find((f) => f.id === id)
    db.runSync('DELETE FROM bookmarks WHERE folder_id = ?', [id])
    db.runSync('DELETE FROM folders WHERE id = ?', [id])
    setState((s) => ({ folders: s.folders.filter((f) => f.id !== id) }))
    useBookmarksStore.setState((s) => ({ bookmarks: s.bookmarks.filter((b) => b.folderId !== id) }))
    const nextFolders = getState().folders
    const fallbackFolderId = nextFolders[0]?.id ?? null
    const settings = useSettingsStore.getState().settings
    if (settings.default_folder_id === id) {
      useSettingsStore.getState().set('default_folder_id', fallbackFolderId)
    }
    if (settings.last_selected_folder_id === id) {
      useSettingsStore.getState().set('last_selected_folder_id', fallbackFolderId)
    }
    syncToShared(nextFolders)
    useUnlockStore.getState().forget(id)
    if (target?.customThumbnailPath) {
      void deleteFolderThumbnail(target.customThumbnailPath)
    }
  },

  reorder: (folders) => {
    const db = getDb()
    folders.forEach((f, i) => {
      db.runSync('UPDATE folders SET sort_order = ? WHERE id = ?', [i, f.id])
    })
    setState({ folders: folders.map((f, i) => ({ ...f, sortOrder: i })) })
    syncToShared(getState().folders)
  },

  setPin: (id, pin) => {
    const db = getDb()
    db.runSync('UPDATE folders SET pin_code = ? WHERE id = ?', [pin, id])
    setState((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, pinCode: pin } : f)),
    }))
  },

  removePin: (id) => {
    const db = getDb()
    db.runSync('UPDATE folders SET pin_code = NULL WHERE id = ?', [id])
    setState((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, pinCode: null } : f)),
    }))
    useUnlockStore.getState().forget(id)
  },

  setCustomThumbnail: (id, path) => {
    const db = getDb()
    db.runSync('UPDATE folders SET custom_thumbnail_path = ? WHERE id = ?', [path, id])
    setState((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, customThumbnailPath: path } : f)),
    }))
  },

  removeCustomThumbnail: async (id) => {
    const db = getDb()
    const target = getState().folders.find((f) => f.id === id)
    db.runSync('UPDATE folders SET custom_thumbnail_path = NULL WHERE id = ?', [id])
    setState((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, customThumbnailPath: null } : f)),
    }))
    if (target?.customThumbnailPath) {
      await deleteFolderThumbnail(target.customThumbnailPath)
    }
  },
}))
