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
