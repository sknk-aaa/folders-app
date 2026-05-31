# サムネブクマ（folders-app）

SafariのShare Extension経由でサイトをサムネイル付きで保存・フォルダ管理するiOSアプリ。Expo Bare Workflow + React Native + TypeScript。SQLiteでローカル保存。v1.2.0 App Store提出済み。

## 厳守事項

- **デザイン実装時は必ず `/frontend-design` を呼び出すこと。**
- `assets/` 以下のファイル名と `require()` パスは **ASCIIのみ**（EAS Build の macOS 環境が日本語名を解決できない）。
- `preprocessing.js` を変更したら `ios/BookrestShareExtension/preprocessing.js` に必ず同期（実機で使われるのはiOS側）。

## ドキュメント索引

- [docs/DESIGN.md](docs/DESIGN.md) — データモデル・ビジネスルール・画面仕様
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — Bundle ID・ビルド手順・注意事項
- [docs/HANDOFF.md](docs/HANDOFF.md) — 実装済み・残タスク・既知の問題
