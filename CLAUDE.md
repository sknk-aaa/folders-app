# サムネブクマ（folders-app）

SafariのShare Extension経由でサイトをサムネイル付きで保存・フォルダ管理するiOSアプリ。Expo Bare Workflow + React Native + TypeScript（SDK 54）。SQLiteでローカル保存。公開中=v1.2.0、提出済み=**v1.5.0**（メモ/ダーク/通知/Pro刷新/日英i18n等）。ビルドは GitHub Actions → TestFlight。

## 厳守事項

- **デザイン実装時は必ず `/frontend-design` を呼び出すこと。**
- `assets/` 以下のファイル名と `require()` パスは **ASCIIのみ**（macOSビルド環境が日本語名を解決できない）。
- `preprocessing.js` を変更したら `ios/BookrestShareExtension/preprocessing.js` に必ず同期（実機で使われるのはiOS側）。
- UI文字列は `tr({ en, ja })`（`src/shared/i18n`）で日英両方を入れる。色は `makeStyles(c: Palette)` で Palette から取る（ダーク対応）。
- 新規ネイティブ依存は **`npx expo install`** で入れる（素の `npm install` はSDK非互換版が入る）。
- 版を上げたら `ios/Bookrest/Info.plist` と `ios/BookrestShareExtension/Info.plist` の `CFBundleShortVersionString` を**両方手動更新**（CIはビルド番号のみ採番）。

## ドキュメント索引

- [docs/DESIGN.md](docs/DESIGN.md) — データモデル・ビジネスルール・画面仕様
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — Bundle ID・ビルド手順・注意事項
- [docs/HANDOFF.md](docs/HANDOFF.md) — 実装済み・残タスク・既知の問題
