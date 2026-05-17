import type { FolderIconId } from './types'

export const MOCK_FOLDERS: Array<{
  name: string
  iconId: FolderIconId
  isDefault: 0 | 1
}> = [
  { name: '未分類', iconId: 'default', isDefault: 1 },
]

export type MockBookmark = {
  folderName: string
  name: string
  url: string
  thumbnailPath: string
}

// 初回起動時は空。フォルダだけ用意してユーザーが自分で追加する。
export const MOCK_BOOKMARKS: MockBookmark[] = []

// 空フォルダのフォールバック画像（local asset）
// FolderCard / FolderDetailScreen から require で参照
export const FOLDER_PLACEHOLDER = require('../../assets/folder-placeholder.png')
