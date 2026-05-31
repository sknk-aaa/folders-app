# サムネブクマ 設計仕様

## 1. アプリ概要

### 目的
Safariで見つけたサイトをサムネイル付きで保存し、フォルダで視覚的に整理できるiOSブックマークアプリ。「ログインしたくないサイトをサムネ付きで手軽に保存」がコアバリュー。

### ターゲット
- スマホでブラウジングしながら気になったページを保存したい人
- ブラウザ標準ブックマークが視覚的に分かりづらいと感じている人

### 配布
- iOS版のみ（App Store、個人開発）

---

## 2. 技術スタック

| 項目 | 採用技術 |
|---|---|
| フレームワーク | Expo Bare Workflow + React Native + TypeScript |
| ビルド | EAS Build（クラウドビルド、Windows対応） |
| 状態管理 | Zustand |
| ローカルDB | expo-sqlite v16 |
| 画像処理 | expo-image-manipulator |
| Share Extension | expo-share-extension v5 |
| 課金 | react-native-purchases（RevenueCat） |
| ストアレビュー | expo-store-review |

---

## 3. 画面構成

| 画面 | ファイル | 備考 |
|---|---|---|
| チュートリアル | TutorialScreen.tsx | 初回起動時のみ自動表示、メニューから再表示可 |
| ホーム | HomeScreen.tsx | フォルダ2列グリッド + 最近追加横スクロール |
| フォルダ詳細 | FolderDetailScreen.tsx | フォルダ内ブックマーク一覧 |
| 全ブックマーク | AllBookmarksScreen.tsx | 追加順固定、グリッド/リスト切替 |
| ブックマーク追加 | AddBookmarkScreen.tsx | URL入力 → WebView → トリム |
| サムネトリミング | TrimScreen.tsx | ドラッグでリサイズ |
| ドロワー | DrawerContent.tsx | ハンバーガーメニュー |
| Share Extension | ShareExtension.tsx | Safari共有からの受け取り |

---

## 4. データモデル（SQLite）

### `folders`
| カラム | 型 | 説明 |
|---|---|---|
| id | TEXT UUID | PK |
| name | TEXT | フォルダ名 |
| icon_id | TEXT | アイコン種別（11種内蔵） |
| sort_order | INTEGER | 表示順 |
| created_at | INTEGER | UNIX時刻 |
| is_default | INTEGER 0/1 | 未分類フォルダフラグ |
| cover_image_path | TEXT | フォルダカバー画像パス（Pro機能） |

### `bookmarks`
| カラム | 型 | 説明 |
|---|---|---|
| id | TEXT UUID | PK |
| folder_id | TEXT | FK → folders.id |
| name | TEXT | サイト名 |
| url | TEXT | URL |
| favicon_url | TEXT | favicon URL |
| thumbnail_path | TEXT | サムネのローカルパス |
| sort_order | INTEGER | フォルダ内の表示順 |
| created_at | INTEGER | UNIX時刻 |

### `settings`（key-value）
| key | 値の例 | 説明 |
|---|---|---|
| default_browser | "safari" / "chrome" / "edge" | デフォルトブラウザ |
| capture_thumbnail | "true" / "false" | サムネ撮影ON/OFF |
| is_premium | "true" / "false" | 課金状態 |
| tutorial_completed | "true" / "false" | チュートリアル完了フラグ |
| default_folder_id | UUID | デフォルト保存先フォルダID |

---

## 5. ビジネスルール

### 無料 / Pro
| 機能 | 無料 | Pro |
|---|---|---|
| ブックマーク保存数 | 30件まで | 無制限 |
| フォルダカバー変更 | ✗ | ✓ |
| 広告 | あり（未実装） | なし |

### ブックマーク上限の挙動（AddBookmarkScreen.tsx）
- **25件目保存時**：保存完了後「あと5件で上限。Proで無制限に」のProモーダルを表示
- **30件目保存時**：保存完了後「無料プランの上限に達しました。Proで無制限に」のProモーダルを表示
- **31件目以降**：保存せずにProモーダルを表示（ブロック）

### Share Extension
- `preprocessing.js`（Safari内で実行）がOGP画像・候補画像・URLを収集
- `ShareExtension.tsx` でUIを表示し、`foldersapp://` スキーム経由でメインアプリへ渡す
- `fallbackUrl`として`window.location.href`を先に取得し、取得失敗時でもURLを返す

---

## 6. 初期データ（seeds）

`src/shared/db/migrations.ts` で管理。

- フォルダ6個（未分類・仕事・エンタメ・ショッピング・ニュース・旅行）
- 各フォルダにサンプルブックマーク3件 = 計18件（Unsplash画像URL使用）
- 再シード条件：「フォルダ名が初期値かつサムネURLがUnsplash/picsum」の場合のみ（ユーザーデータ保護）

---

## 7. デザイン仕様

### カラーパレット（`PALETTE` 定数）
```
bg:            #FAFAF7
surface:       #FFFFFF
ink:           #0A0A0A
textSecondary: #6C6C70
textMuted:     #A8A6A0
border:        #EAE8E2
```

### ルール
- ライトモードのみ（ダークモード非対応）
- 日本語のみ
- アプリ表示名：サムネブクマ
