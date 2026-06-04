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
| フレームワーク | Expo Bare Workflow + React Native + TypeScript（SDK 54） |
| ビルド | GitHub Actions + fastlane → TestFlight（旧EASから移行済み） |
| 状態管理 | Zustand |
| ローカルDB | expo-sqlite |
| 画像処理 | expo-image-manipulator |
| Share Extension | expo-share-extension |
| 課金 | react-native-purchases（RevenueCat） |
| 通知 | expo-notifications（~0.32）/ expo-task-manager |
| 動画（オンボ） | expo-video |
| 多言語判定 | expo-localization（`tr({en,ja})`） |
| ストアレビュー | expo-store-review |

---

## 3. 画面構成

| 画面 | ファイル | 備考 |
|---|---|---|
| チュートリアル | TutorialScreen.tsx | 初回起動時のみ。全4ページ（02・03は動画／expo-video）、最後で通知許可 |
| ホーム | HomeScreen.tsx | フォルダグリッド + 最近追加横スクロール。フォルダ6個目でPro画面へ |
| フォルダ詳細 | FolderDetailScreen.tsx | grid/list/photo 切替、ピンチで列密度 |
| 全ブックマーク | AllBookmarksScreen.tsx | grid/list/photo 切替 |
| ブックマーク追加 | AddBookmarkScreen.tsx | URL入力 → WebView → トリム。メモ入力（Pro）。上限でPro画面へ |
| サムネトリミング | TrimScreen.tsx | ドラッグでリサイズ |
| Pro購入 | pro/screens/ProUpgradeScreen.tsx | **ナビゲーション画面**（旧モーダル）。プラン選択＋単一購入ボタン |
| ドロワー | DrawerContent.tsx | ハンバーガーメニュー。テーマ切替（Pro） |
| Share Extension | ShareExtension.tsx | Safari共有からの受け取り。メモ入力（Pro） |

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
| pin_code | TEXT | フォルダPINロック（null=なし） |
| custom_thumbnail_path | TEXT | フォルダカバー画像パス（Pro機能） |

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
| memo | TEXT | メモ（Pro機能。v1.5 で追加） |
| viewed_at | INTEGER | 初回タップ時刻。null=未読＝積ん読リマインダー対象（v1.5 で追加） |

※ フォルダのカバー画像列は実装上 `custom_thumbnail_path`（型は `customThumbnailPath`）。

### `settings`（key-value）
| key | 値の例 | 説明 |
|---|---|---|
| default_browser | "safari" / "chrome" / "edge" | デフォルトブラウザ |
| capture_thumbnail | "true" / "false" | サムネ撮影ON/OFF |
| is_premium | "true" / "false" | 課金状態 |
| tutorial_completed | "true" / "false" | チュートリアル完了フラグ |
| default_folder_id | UUID | デフォルト保存先フォルダID |
| view_mode | "grid" / "list" / "photo" | 表示モード（v1.5） |
| theme_mode | "light" / "dark" / "auto" | テーマ。Pro限定（無料はライト固定）（v1.5） |
| notification_enabled | "true" / "false" | 積ん読リマインダーON/OFF（v1.5） |

---

## 5. ビジネスルール

### 無料 / Pro（v1.5）
| 機能 | 無料 | Pro |
|---|---|---|
| ブックマーク保存数 | 100件まで | 無制限 |
| フォルダ数 | 5個まで | 無制限 |
| メモ | ✗ | ✓ |
| ダークモード | ✗（ライト固定） | ✓ |
| フォルダカバー変更 | ✗ | ✓ |
| iCloudバックアップ | ✗ | ✓ |

### 価格（2プラン）
- 買い切り（Lifetime）¥1,500 / 月額（Monthly）¥400。表示価格はRevenueCatの `priceString`（フォールバック表示あり）。
- 詳細プロダクトID・Entitlementは OPERATIONS.md 参照。

### ブックマーク上限の挙動（AddBookmarkScreen.tsx, FREE_LIMIT=100 / WARN_AT=90）
- **90件目保存時**：保存後「あと10件で上限」→ `navigation.replace('ProUpgrade', {hint})` でPro画面へ
- **100件目保存時**：保存後「上限に達しました」→ 同上
- **101件目以降**：保存せず `navigation.navigate('ProUpgrade')`（ブロック）
- フォルダ6個目作成時も Pro画面へ。Pro画面はモーダルではなく**ナビゲーション画面**（`ProUpgradeScreen`）。

### Share Extension
- `preprocessing.js`（Safari内で実行）がOGP画像・候補画像・URLを収集
- `ShareExtension.tsx` でUIを表示し、`foldersapp://` スキーム経由でメインアプリへ渡す
- `fallbackUrl`として`window.location.href`を先に取得し、取得失敗時でもURLを返す

---

## 6. 初期データ（seeds）

`src/shared/db/migrations.ts` で管理。

- 初期フォルダは1個のみ：`未分類`（日本語端末）/ `Uncategorized`（他）。サンプルブックマークなし（ユーザーが自分で追加）。
- 旧シード（フォルダ6個＋サンプル18件）からの移行・再シード判定ロジックは残置（`legacyNames` 等）。`legacyNames` の日本語は旧DB照合用なので英語化しない。
- `memo` / `viewed_at` 列は guarded ALTER TABLE で追加（既存DBは pragma で存在チェック）。

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

### ルール（v1.5 で更新）
- **ダークモード対応（Pro限定）**。無料はライト固定。`useTheme()` が `!is_premium` でライトパレットを返す。`makeStyles(c: Palette)` + `useThemedStyles` パターンで色は Palette から取る。
- **日英対応（端末言語で自動切替）**。文字列は `tr({ en, ja })`（`src/shared/i18n`）。日本語端末→日本語、他→英語。
- アプリ表示名：日本語端末=**サムネブクマ** / 英語端末=**Bookrest**（`ios/Bookrest/{ja,en}.lproj`）。バイナリ既定は日本語（主要言語の英語化は審査通過後）。
