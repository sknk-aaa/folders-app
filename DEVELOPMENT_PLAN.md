# ブックマークアプリ（folders-app）開発計画

## Context

iOS向けブックマーク管理アプリ。サイトのサムネイルを自由にトリミングして視覚的に整理できることが最大の特徴。仕様書 `bookmark_app_spec.md` と画面モック `ブクマアプリトップ画面モック.png` に基づいて開発する。

**確定済み設計決定**:
- 画面構成：モック準拠（タブなし・セクション形式）
- フォルダカード：内部ブックマークのサムネモザイク（4分割）
- フォルダ長押し：ドラッグ並び替え ＋ 右下⋮でメニュー（編集・削除）
- サムネON：WebViewでページ読み込み → スクショ → ユーザートリミング
- サムネOFF：OGP画像（og:image）自動取得
- 検索：フォルダ一覧では🔍非表示、全ブックマーク一覧＋フォルダ詳細でのみ表示
- 未分類フォルダ：名前変更・削除とも可能（削除時は中のブックマークも全削除）

---

## ステップ0: 環境構築

### 0-1. Expo Bare Workflowプロジェクト初期化

```bash
npx create-expo-app@latest . --template bare-minimum
```

生成される主要ファイル:
- `App.tsx` / `package.json` / `app.json` / `tsconfig.json`
- `android/` / `ios/` ディレクトリ

### 0-2. ESLint / Prettier 設定

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-react eslint-plugin-react-hooks \
  prettier eslint-config-prettier eslint-plugin-prettier
```

設定ファイル:
- `.eslintrc.js` — TypeScript + React Hooks ルール
- `.prettierrc` — シングルクォート、セミコロンなし、printWidth 100

### 0-3. コア依存パッケージのインストール

```bash
# DB・画像処理
npx expo install expo-sqlite expo-image-manipulator expo-image

# ナビゲーション
npx expo install react-native-screens react-native-safe-area-context \
  react-native-gesture-handler react-native-reanimated
npm install @react-navigation/native @react-navigation/stack @react-navigation/drawer

# 状態管理
npm install zustand

# ドラッグ＆ドロップ並び替え
npm install react-native-draggable-flatlist

# ブラウザ起動・OGP
npx expo install expo-web-browser expo-linking
```

### 0-4. EAS設定

```bash
npx eas-cli init
```

eas.json（development / preview / production プロファイル）を作成。  
⚠️ EAS LoginにはExpoアカウントが必要。

---

## ディレクトリ構造

```
folders-app/
├── src/
│   ├── features/
│   │   ├── folders/
│   │   │   ├── components/       # FolderCard, FolderGrid, FolderIcon
│   │   │   ├── screens/          # FolderListScreen, FolderDetailScreen
│   │   │   └── store.ts
│   │   ├── bookmarks/
│   │   │   ├── components/       # BookmarkCard, BookmarkGrid, BookmarkListItem
│   │   │   │                     # PlaceholderImage, ContextMenu
│   │   │   ├── screens/          # BookmarkListScreen, AddBookmarkScreen
│   │   │   │                     # TrimScreen, SearchScreen
│   │   │   └── store.ts
│   │   └── settings/
│   │       └── store.ts
│   ├── shared/
│   │   ├── components/           # Header, DrawerContent, Toast
│   │   ├── db/
│   │   │   ├── client.ts         # SQLite接続・初期化
│   │   │   └── migrations.ts     # スキーマ定義
│   │   └── types/
│   │       └── index.ts          # Folder, Bookmark, Settings 型定義
│   └── navigation/
│       └── index.tsx
├── assets/
│   └── icons/                    # フォルダアイコン11種
├── App.tsx
├── app.json
├── eas.json
├── tsconfig.json
├── .eslintrc.js
└── .prettierrc
```

---

## Phase 1: コアアプリ完成（MVP）

### 1-1. 型定義・DB層

**ファイル**: `src/shared/types/index.ts`, `src/shared/db/client.ts`, `src/shared/db/migrations.ts`

- `Folder` / `Bookmark` / `Settings` 型定義
- `settings` テーブルに `last_selected_folder_id` を追加（仕様書から漏れ）
- 初回起動時：デフォルトフォルダ5件 ＋ Google ブックマーク1件を自動挿入

### 1-2. Zustand Store

各storeはSQLiteから読み込んで状態を保持。CRUD操作はSQLiteとstoreを同時更新。

### 1-3. ナビゲーション

```
DrawerNavigator（ハンバーガーメニュー）
  └── StackNavigator
        ├── HomeScreen（フォルダ一覧 + 最近追加）
        ├── AllBookmarksScreen（全ブックマーク一覧）
        ├── FolderDetailScreen
        ├── AddBookmarkScreen
        ├── TrimScreen
        └── SearchScreen
```

### 1-4. 共通ヘッダー

- 左：ハンバーガーアイコン（FolderDetailでは「＜戻る」）
- 中央：タイトル
- 右：🔍（HomeScreenでは非表示）＋ ＋

### 1-5. HomeScreen（フォルダー一覧）

モック準拠:
1. フォルダセクション — 2列グリッド（FolderCard：4分割サムネモザイク＋名前＋件数＋⋮）
2. 最近追加ブックマーク — 横スクロール最新10件＋「すべて見る」
3. 広告バナー（Phase 3まではプレースホルダー）

### 1-6. AllBookmarksScreen

- グリッド/リスト切替・ピンチで2/3/4列変更
- 追加順固定・🔍 → SearchScreen

### 1-7. FolderDetailScreen

- ホールド＆スライド並び替え（react-native-draggable-flatlist）
- 別フォルダへのドラッグ移動
- 🔍 → フォルダ内SearchScreen

### 1-8. ブックマーク追加フロー

- サムネON：WebView（react-native-webview）→ スクショ → TrimScreen
- サムネOFF：OGP fetch → 失敗時プレースホルダー

### 1-9. TrimScreen

- PanGestureHandlerで矩形選択
- expo-image-manipulatorでクロップ

### 1-10. ⋮メニュー・編集・削除

- ブックマーク：削除 / 移動 / 編集
- フォルダ：編集（名前・アイコン変更）/ 削除（確認ダイアログ）

### 1-11. 検索（SearchScreen）

- リアルタイムフィルタリング（name + url の LIKE）
- folderId スコープ対応（フォルダ詳細 or 全件）

### 1-12. ハンバーガーメニュー（DrawerContent）

Phase 1実装項目：サムネON/OFF、デフォルトブラウザ選択

### 1-13. デフォルトブラウザで開く

- Safari: `https://...`、Chrome: `googlechrome://...`、Edge: `microsoft-edge-http://...`

---

## Phase 2: Share Extension

- `expo-share-extension` でiOS共有メニュー対応
- App Group経由でURL＋タイトルをメインアプリへ渡す
- URLスキーム `foldersapp://add?url=...&title=...` で起動
- EAS Buildでネイティブ設定を自動化

---

## Phase 3: 商用化

- AdMob（react-native-google-mobile-ads）バナー広告
- 買い切り課金（react-native-iap）＋ 購入復元
- 100件上限ロジック（90件警告 / 100件ブロック）
- チュートリアル（スワイプ式5ページ）

---

## Phase 4: 仕上げ・リリース

- ハンバーガーメニュー全項目・FAQ
- アプリアイコン・スプラッシュ
- App Store申請（TestFlight → 本審査）

---

## Phase 5: バックアップ（リリース後）

- iCloud Drive / Google Drive連携

---

## 検証方法

動作確認はすべて **EAS Build（development profile）→ TestFlight** で実施。  
Expo Goは使用不可（Bare Workflow + ネイティブモジュールのため）。

---

## 未確定事項

- [ ] アプリ名・バンドルID
- [ ] カラーパレット詳細
- [ ] AdMob広告ユニットID
- [ ] App Store Connect設定
