# サムネブクマ 運用情報

## 固定識別子

| 項目 | 値 |
|---|---|
| Bundle ID | `com.sknk.foldersapp` |
| Expo Owner | `sknk-aaa` |
| EAS Project ID | `df21cc8c-6420-4d64-86d5-07d76249ab28` |
| URL Scheme | `foldersapp://` |
| App Group | `group.com.sknk.foldersapp` |
| 開発環境 | WSL2 (Ubuntu) + Windows 11 |

---

## 現在のバージョン状態

| 項目 | 値 |
|---|---|
| 公開中 | 1.2.0 |
| 提出済み | 1.5.0（2026-06-04 提出、主要言語=日本語） |
| Build Number | CI 自動採番（fastlane: `GITHUB_RUN_NUMBER + 100`） |

### ★ 表示バージョン（CFBundleShortVersionString）は手動更新
CI（`fastlane/Fastfile`）は **`CFBundleVersion`（ビルド番号）のみ**自動設定する。
**`CFBundleShortVersionString`（ユーザーに見える版）は committed の Info.plist 値がそのまま使われる**。
版を上げる時は **両方**を手で更新（拡張とメインは一致必須）:
- `ios/Bookrest/Info.plist`
- `ios/BookrestShareExtension/Info.plist`

`app.json` の version はネイティブに反映されない（prebuild が走らないため）。表示版の真実は Info.plist。

---

## ビルド・配信手順

ビルドは **GitHub Actions（EASではない）**。`.github/workflows/ios.yml` → `fastlane ios beta` → TestFlight。

### JS変更のみ（Metro Dev Clientで確認）
```bash
npx expo start --dev-client --tunnel
```
※ ネイティブモジュール（通知/動画/localization等）の挙動・Share Extension・アプリ名は Metro では確認不可。要ビルド。

### ネイティブ変更を含む / 提出用（GitHub Actions）
```bash
git push          # main への push で ios.yml が走り TestFlight へ
# or 手動: gh workflow run ios.yml
```
ネイティブ変更に該当: `app.json`・新規npmパッケージ・Share Extension（Swift/preprocessing）・権限・Info.plist・pbxproj。

### ★ 新しいネイティブ依存は `npx expo install` で入れる
素の `npm install` だと SDK 非互換の最新メジャーが入る。実例: `expo-notifications` を npm で入れて v56（SDK54非互換）が入り、通知許可で **SIGABRT クラッシュ**。必ず:
```bash
npx expo install <package>      # ✓ SDKに合った版
npx expo install --check        # 版ズレ確認
```

---

## In-App Purchase / RevenueCat

| 項目 | 値 |
|---|---|
| 買い切り（Lifetime） | product ID `com.sknk.foldersapp.pro` |
| 月額（Monthly） | product ID `com.sknk.foldersapp.pro.monthly` |
| RevenueCat Entitlement | `Bookrest Pro`（両プロダクトを割当） |
| RevenueCat Offering | `default`（LIFETIME / MONTHLY パッケージ） |

`src/features/pro/store.ts` の `DEV_FORCE_PRO` / `DEV_FORCE_FREE` は dev用（`__DEV__` ガードで本番無効）。
買い切りは v1.2 で承認済みのため、提出時の「審査へ提出するIAP」一覧には新規/編集分（月額・編集した買い切り）だけが出る。

---

## ビルド前チェックリスト

1. `npx tsc --noEmit` でTypeScriptエラーがないこと
2. 追加アセットがGit管理されていること（`git status` で確認、ファイル名は ASCII）
3. **版を上げたら `ios/Bookrest/Info.plist` と `ios/BookrestShareExtension/Info.plist` の `CFBundleShortVersionString` を両方更新**
4. 新規ネイティブ依存は `npx expo install` で入れたか

---

## 注意事項

### アセット名はASCIIのみ
EAS Build の macOS 環境では日本語ファイル名の asset を解決できない。
`assets/` 以下のファイル名と `require()` パスは ASCII のみ使用すること。

### preprocessing.js の同期
`preprocessing.js`（ルート）を変更したら、`ios/BookrestShareExtension/preprocessing.js` に必ず同期する。
実機で実行されるのはiOS側のファイルであり、ルートのファイルは参照されない。

```bash
cp preprocessing.js ios/BookrestShareExtension/preprocessing.js
```

### expo-file-system v19
v19以降、`documentDirectory` 等は `expo-file-system/legacy` に移動した。

```ts
import * as FileSystem from 'expo-file-system/legacy'  // ✓
```

---

## iCloudバックアップ（Pro機能）セットアップ手順

`react-native-cloud-storage` を使用。iCloud Drive のコンテナ（CloudDocuments / ubiquity）にDB＋サムネをbase64で保存する。`ios/` をコミットしているため config plugin は EASビルド時に走らない。**iCloudのエンタイトルメントは `ios/Bookrest/Bookrest.entitlements` に手動追記済み**（app.jsonのプラグインは将来 `expo prebuild` した時の保険）。ネイティブモジュール本体は EAS の `pod install` で自動リンクされる。

### 1. Apple Developer Portal（初回1回）
1. Identifiers → App ID `com.sknk.foldersapp` → Capabilities で **iCloud** を有効化（**iCloud Documents** を含む）。
2. iCloud Containers → `+` → コンテナ **`iCloud.com.sknk.foldersapp`** を作成し、App ID に割り当てる。
3. これが無いと EAS のプロビジョニング生成 or 実行時に失敗する。

### 2. dev/本番で環境(environment)を切り替える ★重要
`ios/Bookrest/Bookrest.entitlements` の `com.apple.developer.icloud-container-environment`:
- **dev build（development profile）**: `Development`（現在この値）
- **本番（production profile / 提出）**: `Production` に変更してからビルド

`app.json` 側のプラグインは `Production` 固定。手動entitlementが実際に効く方なので、ビルド種別に合わせてこの1行を切り替える。

### 3. ビルド・確認フロー
```bash
# dev確認（entitlements environment = Development）
eas build --platform ios --profile development
# → 実機(iCloudサインイン済)に入れる → Metro接続
# → DEV_FORCE_PRO=true でPro画面へ → バックアップ → アプリ削除 → 再インストール → 復元 → サムネ表示を確認

# 本番（entitlements environment = Production に変更、DEV_FORCE_PRO=false に戻す）
eas build --platform ios --profile production
```

### 4. トラブル時
- 実行時に「コンテナが見つからない」→ environment(Development↔Production) の不一致が筆頭。entitlementsを合わせて再ビルド。コンテナがPortalに存在するかも確認。
- バックアップ保存先は AppData スコープ（隠し領域）なので Files アプリには出ない。
