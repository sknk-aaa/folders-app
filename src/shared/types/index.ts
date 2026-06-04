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
  | 'travel'
  | 'book'
  | 'default'

export type Folder = {
  id: string
  name: string
  iconId: FolderIconId
  sortOrder: number
  createdAt: number
  isDefault: number
  pinCode: string | null
  customThumbnailPath: string | null
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
export type ThemeMode = 'light' | 'dark' | 'auto'

export type Settings = {
  default_browser: DefaultBrowser
  capture_thumbnail: boolean
  grid_columns: GridColumns
  view_mode: ViewMode
  is_premium: boolean
  tutorial_completed: boolean
  last_selected_folder_id: string | null
  default_folder_id: string | null
  save_count: number
  launch_count: number
  last_backup_at: number | null
  theme_mode: ThemeMode
}

export type RootStackParamList = {
  Home: undefined
  AllBookmarks: undefined
  FolderDetail: { folderId: string }
  AddBookmark: { folderId?: string; url?: string; title?: string; thumbnailUri?: string }
  Trim: { imageUri: string }
  Search: { folderId?: string }
  Tutorial: undefined
  Backup: undefined
}

export type DrawerParamList = {
  Main: undefined
}
