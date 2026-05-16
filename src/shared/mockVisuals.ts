import type { FolderIconId } from './types'

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

export type MockBookmark = {
  folderName: string
  name: string
  url: string
  thumbnailPath: string
}

// 各フォルダに3件ずつ、合計18件のテーマ別ブックマーク
// 各フォルダの先頭3件がフォルダカードのモザイクに使われる
export const MOCK_BOOKMARKS: MockBookmark[] = [
  // 記事 (コーヒー・本・部屋の暖かい雰囲気)
  {
    folderName: '記事',
    name: '暮らしを整える朝のルーティン',
    url: 'https://kurashi-style.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=720&q=80',
  },
  {
    folderName: '記事',
    name: '心に響く名エッセイ10選',
    url: 'https://essay-mag.com',
    thumbnailPath: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=720&q=80',
  },
  {
    folderName: '記事',
    name: '今日のニュース総まとめ',
    url: 'https://news-digest.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=720&q=80',
  },

  // 音楽 (ヘッドホン・ライブ・レコード)
  {
    folderName: '音楽',
    name: '高音質ヘッドホンおすすめ7選',
    url: 'https://audio-review.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=720&q=80',
  },
  {
    folderName: '音楽',
    name: '注目の音楽フェス2024',
    url: 'https://music-festival.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=720&q=80',
  },
  {
    folderName: '音楽',
    name: '名盤アナログレコードガイド',
    url: 'https://vinyl-shop.com',
    thumbnailPath: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=720&q=80',
  },

  // 仕事 (デスク・ラップトップ・会議)
  {
    folderName: '仕事',
    name: '集中力を高めるデスク環境',
    url: 'https://focus-work.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=720&q=80',
  },
  {
    folderName: '仕事',
    name: 'リモートワーカー必携アイテム',
    url: 'https://worktips.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=720&q=80',
  },
  {
    folderName: '仕事',
    name: '効果的な会議の進め方',
    url: 'https://biz-meeting.com',
    thumbnailPath: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=720&q=80',
  },

  // 買い物 (ショッピングバッグ・ニット・キャンドル)
  {
    folderName: '買い物',
    name: '週末のお買い物リスト',
    url: 'https://weekend-shop.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=720&q=80',
  },
  {
    folderName: '買い物',
    name: '上質ニットの選び方',
    url: 'https://knit-style.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=720&q=80',
  },
  {
    folderName: '買い物',
    name: 'アロマキャンドルおすすめ',
    url: 'https://aroma-life.com',
    thumbnailPath: 'https://images.unsplash.com/photo-1602874801007-aa0a0a8c5cae?w=720&q=80',
  },

  // 旅行 (ビーチ・街・空)
  {
    folderName: '旅行',
    name: '週末に行きたい国内ビーチ',
    url: 'https://beach-japan.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=720&q=80',
  },
  {
    folderName: '旅行',
    name: 'ヨーロッパ街歩きガイド',
    url: 'https://europe-walk.com',
    thumbnailPath: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=720&q=80',
  },
  {
    folderName: '旅行',
    name: '機内から見える絶景',
    url: 'https://airline-mag.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=720&q=80',
  },

  // 読書 (開いた本・図書館・積読)
  {
    folderName: '読書',
    name: '今読みたいおすすめ本15選',
    url: 'https://bookblog.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=720&q=80',
  },
  {
    folderName: '読書',
    name: '名作小説まとめ',
    url: 'https://novel-list.com',
    thumbnailPath: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=720&q=80',
  },
  {
    folderName: '読書',
    name: '積読を楽しむ方法',
    url: 'https://tsundoku.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=720&q=80',
  },
]

// 空フォルダのフォールバック画像（local asset）
// FolderCard / FolderDetailScreen から require で参照
export const FOLDER_PLACEHOLDER = require('../../assets/folder-placeholder.png')
