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
| バージョン | 1.2.0 |
| Build Number | 22（提出済み） |
| 次のbuild number | 23（EAS auto-increment） |

`eas.json` で `autoIncrement: true`、`appVersionSource: "local"` を設定済み。
production build 失敗時も auto-increment が動くことがある。次のビルド前に `app.json` を確認すること。

---

## ビルド・配信手順

詳細は `~/.claude/docs/IOS_CICD_RECIPE.md` を参照。

### JS変更のみ（Metro Dev Clientで確認）
```bash
npx expo start --dev-client --tunnel
```
iPhone側でフォルダズアプリ（開発用）を起動 → 表示された `exp://` URLを入力。

### ネイティブ変更を含む場合（EAS Build）
```bash
npx eas-cli build --platform ios --profile development   # 開発確認用
npx eas-cli build --platform ios --profile production    # 本番提出用（~15-20分）
```

ネイティブ変更に該当するもの: `app.json`・新規npmパッケージ・Share Extension（Swift/preprocessing）・権限追加。

---

## ビルド前チェックリスト

1. `npx tsc --noEmit` でTypeScriptエラーがないこと
2. 追加アセットがGit管理されていること（`git status` で確認）
3. `app.json` と `ios/*/Info.plist` のバージョン・build numberが一致していること

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
