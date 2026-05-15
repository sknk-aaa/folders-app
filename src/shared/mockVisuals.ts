import type { Folder, FolderIconId } from './types'

type FolderVisual = {
  images: string[]
}

export const MOCK_FOLDERS: Array<{
  name: string
  iconId: FolderIconId
  isDefault: 0 | 1
}> = [
  { name: '記事', iconId: 'article', isDefault: 1 },
  { name: '音楽', iconId: 'music', isDefault: 0 },
  { name: '仕事', iconId: 'work', isDefault: 0 },
  { name: '買い物', iconId: 'shopping', isDefault: 0 },
  { name: '旅行', iconId: 'travel', isDefault: 0 },
  { name: '読書', iconId: 'book', isDefault: 0 },
]

export const MOCK_BOOKMARKS = [
  {
    name: '自然と暮らす、心地よい家づくり',
    url: 'https://goodrooms.jp',
    thumbnailPath: 'https://picsum.photos/seed/folders-recent-cabin/360/360',
  },
  {
    name: '東京のおしゃれカフェ10選',
    url: 'https://cafe-note.com',
    thumbnailPath: 'https://picsum.photos/seed/folders-recent-cafe/360/360',
  },
  {
    name: '簡単に作れる絶品パスタレシピ',
    url: 'https://kurashiru.com',
    thumbnailPath: 'https://picsum.photos/seed/folders-recent-pasta/360/360',
  },
  {
    name: '集中できるデスク環境の作り方',
    url: 'https://lifehacker.jp',
    thumbnailPath: 'https://picsum.photos/seed/folders-recent-desk/360/360',
  },
  {
    name: '週末に行きたい国内旅行先まとめ',
    url: 'https://tabi-navi.jp',
    thumbnailPath: 'https://picsum.photos/seed/folders-recent-beach/360/360',
  },
]

const VISUALS_BY_ICON: Partial<Record<FolderIconId, FolderVisual>> = {
  article: {
    images: [
      'https://picsum.photos/seed/folders-article-coffee/720/540',
      'https://picsum.photos/seed/folders-article-books/360/270',
      'https://picsum.photos/seed/folders-article-room/360/270',
    ],
  },
  music: {
    images: [
      'https://picsum.photos/seed/folders-music-headphones/720/540',
      'https://picsum.photos/seed/folders-music-live/360/270',
      'https://picsum.photos/seed/folders-music-record/360/270',
    ],
  },
  work: {
    images: [
      'https://picsum.photos/seed/folders-work-laptop/720/540',
      'https://picsum.photos/seed/folders-work-meeting/360/270',
      'https://picsum.photos/seed/folders-work-desk/360/270',
    ],
  },
  shopping: {
    images: [
      'https://picsum.photos/seed/folders-shopping-basket/720/540',
      'https://picsum.photos/seed/folders-shopping-clothes/360/270',
      'https://picsum.photos/seed/folders-shopping-candles/360/270',
    ],
  },
  travel: {
    images: [
      'https://picsum.photos/seed/folders-travel-beach/720/540',
      'https://picsum.photos/seed/folders-travel-street/360/270',
      'https://picsum.photos/seed/folders-travel-flight/360/270',
    ],
  },
  book: {
    images: [
      'https://picsum.photos/seed/folders-book-open/720/540',
      'https://picsum.photos/seed/folders-book-library/360/270',
      'https://picsum.photos/seed/folders-book-stack/360/270',
    ],
  },
  default: {
    images: [
      'https://picsum.photos/seed/folders-default-main/720/540',
      'https://picsum.photos/seed/folders-default-side-a/360/270',
      'https://picsum.photos/seed/folders-default-side-b/360/270',
    ],
  },
}

const ICON_BY_NAME: Record<string, FolderIconId> = {
  未分類: 'article',
  エンタメ: 'music',
  ショッピング: 'shopping',
  ニュース: 'article',
  勉強: 'book',
}

export function getFolderVisual(folder: Folder): FolderVisual {
  const iconId = ICON_BY_NAME[folder.name] ?? folder.iconId
  return VISUALS_BY_ICON[iconId] ?? VISUALS_BY_ICON.default!
}
