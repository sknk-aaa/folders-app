export type FolderIconId =
  | 'article'
  | 'music'
  | 'video'
  | 'work'
  | 'shopping'
  | 'recipe'
  | 'game'
  | 'sns'
  | 'news'
  | 'study'
  | 'default'

export type Folder = {
  id: string
  name: string
  iconId: FolderIconId
  sortOrder: number
  createdAt: number
  isDefault: number
}

export type Bookmark = {
  id: string
  folderId: string
  name: string
  url: string
  faviconUrl: string | null
  thumbnailPath: string | null
  sortOrder: number
  createdAt: number
}

export type DefaultBrowser = 'safari' | 'chrome' | 'edge'
export type ViewMode = 'grid' | 'list'
export type GridColumns = 2 | 3 | 4

export type Settings = {
  default_browser: DefaultBrowser
  capture_thumbnail: boolean
  grid_columns: GridColumns
  view_mode: ViewMode
  is_premium: boolean
  tutorial_completed: boolean
  last_selected_folder_id: string | null
}

export type RootStackParamList = {
  Home: undefined
  AllBookmarks: undefined
  FolderDetail: { folderId: string }
  AddBookmark: { folderId?: string; url?: string; title?: string; thumbnailUri?: string }
  Trim: { imageUri: string }
  Search: { folderId?: string }
}

export type DrawerParamList = {
  Main: undefined
}
