import { create } from 'zustand'
import { getDb } from '../../shared/db/client'
import { createId } from '../../shared/utils/id'
import type { Bookmark } from '../../shared/types'

type BookmarksStore = {
  bookmarks: Bookmark[]
  load: () => void
  add: (data: Omit<Bookmark, 'id' | 'createdAt' | 'sortOrder'>) => Bookmark
  update: (id: string, name: string, url: string) => void
  move: (id: string, folderId: string) => void
  remove: (id: string) => void
  reorder: (folderId: string, bookmarks: Bookmark[]) => void
  byFolder: (folderId: string) => Bookmark[]
  recent: (limit?: number) => Bookmark[]
  total: () => number
}

function toBookmark(row: Record<string, unknown>): Bookmark {
  return {
    id: row.id as string,
    folderId: row.folder_id as string,
    name: row.name as string,
    url: row.url as string,
    faviconUrl: (row.favicon_url as string | null) ?? null,
    thumbnailPath: (row.thumbnail_path as string | null) ?? null,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as number,
  }
}

export const useBookmarksStore = create<BookmarksStore>((setState, getState) => ({
  bookmarks: [],

  load: () => {
    const db = getDb()
    const rows = db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM bookmarks ORDER BY created_at DESC',
    )
    setState({ bookmarks: rows.map(toBookmark) })
  },

  add: (data) => {
    const db = getDb()
    const id = createId()
    const now = Date.now()
    const maxOrder = getState()
      .bookmarks.filter((b) => b.folderId === data.folderId)
      .reduce((m, b) => Math.max(m, b.sortOrder), -1)
    db.runSync(
      'INSERT INTO bookmarks (id, folder_id, name, url, favicon_url, thumbnail_path, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        data.folderId,
        data.name,
        data.url,
        data.faviconUrl,
        data.thumbnailPath,
        maxOrder + 1,
        now,
      ],
    )
    const bookmark: Bookmark = { ...data, id, sortOrder: maxOrder + 1, createdAt: now }
    setState((s) => ({ bookmarks: [bookmark, ...s.bookmarks] }))
    return bookmark
  },

  update: (id, name, url) => {
    const db = getDb()
    db.runSync('UPDATE bookmarks SET name = ?, url = ? WHERE id = ?', [name, url, id])
    setState((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, name, url } : b)),
    }))
  },

  move: (id, folderId) => {
    const db = getDb()
    db.runSync('UPDATE bookmarks SET folder_id = ? WHERE id = ?', [folderId, id])
    setState((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, folderId } : b)),
    }))
  },

  remove: (id) => {
    const db = getDb()
    db.runSync('DELETE FROM bookmarks WHERE id = ?', [id])
    setState((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) }))
  },

  reorder: (folderId, bookmarks) => {
    const db = getDb()
    bookmarks.forEach((b, i) => {
      db.runSync('UPDATE bookmarks SET sort_order = ? WHERE id = ?', [i, b.id])
    })
    setState((s) => ({
      bookmarks: [
        ...s.bookmarks.filter((b) => b.folderId !== folderId),
        ...bookmarks.map((b, i) => ({ ...b, sortOrder: i })),
      ],
    }))
  },

  byFolder: (folderId) =>
    getState()
      .bookmarks.filter((b) => b.folderId === folderId)
      .sort((a, b) => a.sortOrder - b.sortOrder),

  recent: (limit = 10) =>
    [...getState().bookmarks].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit),

  total: () => getState().bookmarks.length,
}))
