import { createMMKV } from 'react-native-mmkv'

// iOS: Info.plistにAppGroup="group.com.sknk.foldersapp"を設定済みのとき、
// path未指定でAppGroupディレクトリが使われる。
// mode: 'multi-process' でメインアプリとShare Extensionで安全に共有可能。
const storage = createMMKV({
  id: 'bookrest-shared',
  mode: 'multi-process',
})

export type SharedFolder = {
  id: string
  name: string
  sortOrder: number
}

export type QueuedBookmark = {
  url: string
  name: string
  folderId: string
  ogImageUrl: string | null
  createdAt: number
}

export function setFolders(folders: SharedFolder[]): void {
  storage.set('folders', JSON.stringify(folders))
}

export function getFolders(): SharedFolder[] {
  const raw = storage.getString('folders')
  if (!raw) return []
  try {
    return JSON.parse(raw) as SharedFolder[]
  } catch {
    return []
  }
}

export function queueBookmark(b: QueuedBookmark): void {
  const raw = storage.getString('queue') ?? '[]'
  let list: QueuedBookmark[] = []
  try {
    list = JSON.parse(raw) as QueuedBookmark[]
  } catch {
    list = []
  }
  list.push(b)
  storage.set('queue', JSON.stringify(list))
}

export function drainQueue(): QueuedBookmark[] {
  const raw = storage.getString('queue') ?? '[]'
  let list: QueuedBookmark[] = []
  try {
    list = JSON.parse(raw) as QueuedBookmark[]
  } catch {
    list = []
  }
  storage.set('queue', '[]')
  return list
}
