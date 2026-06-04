import type { FolderIconId } from './types'

export const MOCK_FOLDERS: Array<{
  name: string
  iconId: FolderIconId
  isDefault: 0 | 1
}> = [
  { name: 'Uncategorized', iconId: 'default', isDefault: 1 },
]

export type MockBookmark = {
  folderName: string
  name: string
  url: string
  thumbnailPath: string
}

// Empty on first launch. Only folders are prepared; the user adds bookmarks themselves.
export const MOCK_BOOKMARKS: MockBookmark[] = []

// Fallback image for empty folders (local asset).
// Referenced via require from FolderCard / FolderDetailScreen.
export const FOLDER_PLACEHOLDER = require('../../assets/folder-placeholder.png')
