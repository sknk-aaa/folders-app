# folders-app 開発ログ

## プロジェクト概要

| 項目 | 値 |
|---|---|
| アプリ名 | folders-app |
| Bundle ID | `com.sknk.foldersapp` |
| Expo Owner | `sknk-aaa` |
| Project ID | `df21cc8c-6420-4d64-86d5-07d76249ab28` |
| URL Scheme | `foldersapp://` |
| App Group | `group.com.sknk.foldersapp` |
| 開発環境 | WSL2 (Ubuntu) + Windows 11 |

---

## 実装済みフェーズ

### Phase 1 ― コアアプリ（MVP）✅
- フォルダ一覧（2列グリッド、ドラッグ並び替え、サムネモザイク）
- フォルダ詳細（ブックマーク一覧、ドラッグ並び替え）
- 全ブックマーク一覧（グリッド / リスト切替）
- ブックマーク追加（URL入力→WebView→スクリーンショット→トリミング）
- ブックマーク編集・削除・フォルダ移動
- デフォルトブラウザで開く（Safari / Chrome / Edge）
- 検索（フォルダ内・全体）
- ハンバーガーメニュー（設定: サムネON/OFF, ブラウザ選択）
- SQLite永続化（expo-sqlite v16）

### Phase 2 ― Share Extension ✅
- Safari等から「共有」でURLをアプリに送れる
- `expo-share-extension` v5 使用
- App Group経由でデータ受け渡し（`foldersapp://add?url=...`）

### Phase 3 ― チュートリアル・上限 ✅
- 初回起動時チュートリアル（5ページスワイプ式）
- ブックマーク100件上限（90件で警告、100件でブロック）
- 初期データ: テーマ別6フォルダ × 3件 = 18件のサンプルブックマーク

### 未実装（Phase 3 残り・Phase 4）
- AdMob広告バナー（HomeScreen下部、無料版のみ）
- 買い切り課金（react-native-iap）
- ハンバーガーメニュー残項目（FAQ、App Storeレビュー、購入済み表示）
- アプリアイコン・スプラッシュ画面
- iCloud / Google Drive バックアップ（プレミアム機能）

---

## ハマったポイントと解決策

### 1. expo-file-system v19 で API が変わった

**症状**: `documentDirectory` が undefined になる  
**原因**: expo-file-system v19 で `expo-file-system/legacy` に移動した  
**解決**: インポートを変更

```ts
// ❌
import * as FileSystem from 'expo-file-system'

// ✅
import * as FileSystem from 'expo-file-system/legacy'
```

---

### 2. ngrok トンネルが起動しない（WSL2環境）

**症状**:
```
CommandError: failed to start tunnel
```
または
```
CommandError: invalid tunnel configuration
yaml: unmarshal errors:
  line 1: field authtoken not found in type config.HTTPv2Tunnel
```

**原因**:
- `@expo/ngrok-bin` が使う ngrok v2.3.41 は、無料 ngrok アカウントでは使用不可（最低 v3.20.0 が必要）
- システムに snap でインストール済みの ngrok v3.39.1 は参照されていなかった
- ngrok v3 は API が厳格で、v2 専用フィールド（`authtoken`, `configPath`, `port`）をトンネル作成リクエストで受け付けない
- ngrok v3 はセッション確立前にトンネルをクラウド側に登録するため、503 リトライ時に "already exists" エラーが発生する

**解決**: `scripts/patch-ngrok.js` + `postinstall` フックで3点を修正

1. `@expo/ngrok-bin` をシステムの `/snap/bin/ngrok`（v3）に差し替え
2. トンネル作成リクエストから v3 非対応フィールドを除外
3. "already exists" エラー時は新 UUID で再試行

```bash
# npm install 後は自動でパッチが当たる（postinstall）
# 手動で再適用したい場合:
node scripts/patch-ngrok.js
```

---

### 3. ngrok v2 の authtoken が設定されていなかった

**症状**: `ERR_NGROK_4018` (authtoken required)  
**原因**: snap の ngrok v3 の設定（`~/.config/ngrok/ngrok.yml`）と、ngrok v2 バイナリが読む設定（`~/.ngrok2/ngrok.yml`）は別ファイル  
**解決**: 上記 patch で v3 バイナリに切り替えたため不要になった（v3 の設定はそのまま有効）

---

### 4. DB マイグレーションが動かない

**症状**: 初期データを変更しても反映されない  
**原因**: マイグレーションは「フォルダ名が一致 かつ ブックマークのサムネが全部 picsum/Unsplash URL」の場合のみ実行する（ユーザーデータ保護のため）  
**解決**: アプリを削除して再インストールすると強制的にシード v3 が流れる

---

### 5. TrimScreen の座標ズレ

**症状**: トリミング範囲がずれる  
**原因**: 画面上の座標をそのまま使うと、実際の画像サイズとスケールが合わない  
**解決**: スケール係数を計算して実画像の座標に変換

```ts
const scaleX = imageActualWidth / SCREEN_W
const scaleY = imageActualHeight / displayedHeight
```

---

## 開発フロー（日常作業）

### コードを変更して実機確認する

```bash
# 1. Metro サーバー起動（WSL2 → iPhone はトンネル必須）
npx expo start --dev-client --tunnel

# 2. iPhone の Expo Dev Client アプリを開いて QR スキャン
#    または「Enter URL manually」で表示された exp:// URL を入力
```

### EAS Build（ネイティブコードを変更したとき）

ネイティブモジュールの追加・app.json 変更・Share Extension の変更時は EAS ビルドが必要。

```bash
npx eas-cli build --platform ios --profile development
# ビルド完了後、TestFlight または EAS のインストールリンクからインストール
```

> JS だけの変更（画面・ロジック）はホットリロードで即反映。EAS ビルドは不要。

---

## 次にやること（優先度順）

### 🔴 高優先 ― リリース必須

#### 1. AdMob 広告バナー

1. [Google AdMob コンソール](https://admob.google.com/) でアプリを登録し、**iOS App ID** と**バナー広告ユニット ID** を取得
2. パッケージをインストール:
   ```bash
   npx expo install react-native-google-mobile-ads
   ```
3. `app.json` に追記:
   ```json
   {
     "plugins": [
       ["react-native-google-mobile-ads", {
         "iosAppId": "ca-app-pub-XXXX~XXXX"
       }]
     ]
   }
   ```
4. `HomeScreen.tsx` の下部に `<BannerAd />` を追加（`is_premium === false` のときのみ表示）
5. EAS Build が必要（ネイティブモジュールのため）

#### 2. 買い切り課金（react-native-iap）

1. App Store Connect でプロダクトを登録:
   - Type: **Non-Consumable**
   - Product ID: `com.sknk.foldersapp.premium`
2. パッケージをインストール:
   ```bash
   npx expo install react-native-iap
   ```
3. `app.json` に追記:
   ```json
   {
     "plugins": ["react-native-iap"]
   }
   ```
4. 購入フロー実装（購入・復元）
5. 購入完了後に `settings.is_premium = true` を保存
6. EAS Build が必要

### 🟡 中優先 ― UX 改善

#### 3. ハンバーガーメニュー残項目

`src/shared/components/DrawerContent.tsx` に以下を追加:
- **よくある質問**: 静的テキスト画面へ遷移
- **アプリを評価**: `expo-store-review` で App Store レビュー画面を開く
- **プレミアムを購入**: 上記課金フローへ遷移
- **購入を復元**: `react-native-iap` の `getAvailablePurchases()`

#### 4. アプリアイコン・スプラッシュ画面

`app.json` の `icon` / `splash` に画像を設定後、EAS Build:
```
assets/icon.png        (1024×1024)
assets/splash.png      (2048×2048)
```

### 🟢 低優先 ― リリース後でも可

#### 5. iCloud バックアップ（プレミアム機能）

`expo-file-system` で SQLite ファイルを iCloud コンテナにコピー

#### 6. Google Drive バックアップ（プレミアム機能）

Google Drive API + OAuth2

---

## 主要ファイルマップ

```
src/
├── features/
│   ├── folders/
│   │   ├── components/
│   │   │   ├── FolderCard.tsx          フォルダカード（モザイクサムネ）
│   │   │   ├── SortableFolderGrid.tsx  ドラッグ並び替えグリッド
│   │   │   └── FolderEditModal.tsx     フォルダ名・アイコン編集
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx          ホーム（フォルダ一覧 + 最近追加）
│   │   │   └── FolderDetailScreen.tsx  フォルダ詳細
│   │   └── store.ts                    フォルダ Zustand ストア
│   ├── bookmarks/
│   │   ├── components/
│   │   │   ├── BookmarkCard.tsx        ブックマークカード
│   │   │   └── BookmarkCollectionList.tsx グリッド/リスト共通コンテナ
│   │   ├── screens/
│   │   │   ├── AddBookmarkScreen.tsx   追加フロー（URL→WebView→トリム）
│   │   │   ├── TrimScreen.tsx          サムネトリミング
│   │   │   └── AllBookmarksScreen.tsx  全ブックマーク一覧
│   │   └── store.ts                    ブックマーク Zustand ストア
│   ├── settings/
│   │   └── store.ts                    設定ストア
│   └── tutorial/
│       └── TutorialScreen.tsx          チュートリアル
├── shared/
│   ├── components/
│   │   ├── Header.tsx
│   │   └── DrawerContent.tsx           ハンバーガーメニュー ← 残項目を追加する場所
│   ├── db/
│   │   ├── client.ts                   SQLite 接続
│   │   └── migrations.ts               スキーマ・初期データ（シード v3）
│   ├── mockVisuals.ts                  初期サンプルデータ（フォルダ・ブックマーク定義）
│   └── types/index.ts                  型定義
├── navigation/index.tsx                ナビゲーション構成
ShareExtension.tsx                      Share Extension エントリポイント
App.tsx                                 アプリエントリポイント
scripts/patch-ngrok.js                  ngrok v3 互換パッチ（postinstall）
```
