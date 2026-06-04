import { createMMKV } from 'react-native-mmkv'

// iOS: When AppGroup="group.com.sknk.foldersapp" is set in Info.plist,
// the AppGroup directory is used when path is unspecified.
// mode: 'multi-process' allows safe sharing between the main app and the Share Extension.
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
  memo?: string | null
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

export function setPremium(isPremium: boolean): void {
  storage.set('is_premium', isPremium)
}

export function getPremium(): boolean {
  return storage.getBoolean('is_premium') ?? false
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
