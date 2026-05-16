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
  // 記事 (ライフスタイル・雑誌・カフェ)
  {
    folderName: '記事',
    name: '週末に楽しむブックカフェ巡り',
    url: 'https://bookcafe-tokyo.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1457369804613-52c61a9bcefc?w=720&q=80',
  },
  {
    folderName: '記事',
    name: 'デザイナーが愛読する雑誌5選',
    url: 'https://magazine-guide.com',
    thumbnailPath: 'https://images.unsplash.com/photo-1576502200916-3808e07386a5?w=720&q=80',
  },
  {
    folderName: '記事',
    name: '今日のニュース総まとめ',
    url: 'https://news-digest.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=720&q=80',
  },

  // 音楽 (楽器・スタジオ・ライブ)
  {
    folderName: '音楽',
    name: 'アナログレコードの世界',
    url: 'https://vinyl-mag.com',
    thumbnailPath: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=720&q=80',
  },
  {
    folderName: '音楽',
    name: 'ギタリストおすすめの一本',
    url: 'https://guitar-life.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=720&q=80',
  },
  {
    folderName: '音楽',
    name: '深夜のステージ特集',
    url: 'https://stage-night.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=720&q=80',
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

  // 買い物 (グルメ・スイーツ・マーケット)
  {
    folderName: '買い物',
    name: '話題のスイーツショップ',
    url: 'https://sweets-shop.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=720&q=80',
  },
  {
    folderName: '買い物',
    name: '産地直送のフレッシュマーケット',
    url: 'https://fresh-market.jp',
    thumbnailPath: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=720&q=80',
  },
  {
    folderName: '買い物',
    name: '北欧雑貨セレクトショップ',
    url: 'https://nordic-zakka.com',
    thumbnailPath: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=720&q=80',
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
