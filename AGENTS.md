# Bookrest / サムネブクマ（folders-app・AI向け）

> 同dirの `CLAUDE.md` も併設。共通ルール（コミュニケーション/Git/コード規約/`gp`等）は `/home/aaa/project/AGENTS.md`。ここはこのアプリ固有のみ。

## アプリ概要

Safari の Share Extension からサイトをサムネイル付きで保存・フォルダ管理する iOS ブックマークアプリ。「ログイン/会員登録したくないサイトのお気に入りを、サムネ付きで自分用にまとめる」のがコアバリュー（あとで読む・レシピ・旅行・買い物候補 等）。Expo Bare Workflow + React Native + TypeScript（SDK 54 / RN 0.81 / React 19）。ローカル保存は expo-sqlite。状態は Zustand。i18n は `src/shared/i18n` の `tr({en,ja})` で端末言語に追従。課金は RevenueCat（`react-native-purchases`）。iCloud バックアップは `react-native-cloud-storage`。

## 事業/マーケ方針

- このアプリは公開後も、ASO・ストア画像・オンボーディング・Pro導線・レビュー獲得・SNS/動画施策を継続改善して売上を作る前提で扱う。
- コア訴求は「ログイン不要で、あとで見たいページをサムネ付きで整理できる」。単なるブラウザブックマークではなく、買い物候補・レシピ・旅行・あとで読むを視覚的に思い出せる価値を前面に出す。
- 英語プライマリ化済み。海外向けは Bookrest を主役、日本向けはサムネブクマを自然に出す。タイトル変更は順位変動リスクが高いため、原則キーワード欄・サブタイトル・スクショ訴求で改善する。
- マーケ施策、ストア画像方針、SNS/動画台本、ASO仮説は `docs/MARKETING.md` に蓄積する。

## 固有の厳守事項（CLAUDE.md由来）

- デザイン実装時は必ず `/frontend-design` を呼ぶ（Claude Code）。Codex では同等の設計検討を先に行う。
- `assets/` 配下のファイル名と `require()` パスは **ASCIIのみ**（macOSビルド環境が日本語名を解決できない）。
- `preprocessing.js` を変更したら `ios/BookrestShareExtension/preprocessing.js` に**必ず同期**（実機で使われるのは iOS 側）。
- UI文字列は `tr({ en, ja })` で日英両方を入れる。色は `makeStyles(c: Palette)` で Palette から取る（ダーク対応）。
- 新規ネイティブ依存は **`npx expo install`** で入れる（素の `npm install` は SDK 非互換版が入る → 過去に通知クラッシュ）。
- 版を上げたら `ios/Bookrest/Info.plist` と `ios/BookrestShareExtension/Info.plist` の `CFBundleShortVersionString` を**両方手動更新**（CIはビルド番号のみ採番。`app.json` の version はネイティブに反映されない）。

## プロジェクト事実（メモリ統合）

- **ビルドは GitHub Actions + fastlane → TestFlight に移行済み・実証済み**。EAS には戻さない（無料ビルド上限が詰まったため移行）。public リポなので Actions は無制限無料。リリースビルドは TestFlight 経由（dev-client ではない＝Metro 不可）。
- **`ios/`（と android/）は git 管理している＋prebuild しない**。よって **app.json の config plugin はビルド時に走らない**（prebuild 時のみ）。ネイティブ追加は「依存追加（pod install で autolink）＋ `ios/` の手動編集（entitlements/Info.plist）」で進める。`expo prebuild` は Share Extension の手編集が飛ぶので原則禁止。config plugin は将来の保険として app.json に残す。
- **2ターゲット署名**: メイン `com.sknk.foldersapp` ＋ 拡張 `com.sknk.foldersapp.ShareExtension` を fastlane match で管理。証明書は private リポ `sknk-aaa/certificates`。Secrets 設定済み。ビルド番号は `GITHUB_RUN_NUMBER + 100`。
- **リリース状況**: 公開中 v1.2.0 / v1.5.0 審査通過（日本語プライマリ・Pro機能群/i18n/購入画面刷新/通知/正方形表示等の大型更新）/ **v1.5.1 が英語プライマリ化＋ガイドライン3.1.2対応で提出済み（承認待ち）**。
- **英語プライマリ化**: コード側バイナリ反転済み（既定 `CFBundleDisplayName`→Bookrest、写真許可文→英語、`CFBundleDevelopmentRegion`/pbxproj `developmentRegion`→en、app.json name→Bookrest）。日本語は `ios/Bookrest/ja.lproj` ローカライズで提供。ASC の主要言語=English は審査通過後にしか変えられない運用制約があり、対応済み。海外露出は英語一貫の方が CV が高いという判断（日本は日本語ローカライズで不変）。
- **ASO/集客方針**: タイトル（名前）は触らない（最重要フィールド＝再インデックスで順位が揺れる＋ブランド/指名検索を失う）。安全なレバーはキーワード欄・サブタイトル（2〜4週で入替可）。TikTok 由来の指名検索依存から「あとで読む」「ブックマーク」等の発見検索で上位を取るのが目標。保存3回でレビュー依頼済み。
- **UI導線**: たまにしか使わない補助・拡散系機能は**ドロワー（ハンバーガー）に置く**。フォルダ画面の「⋮」メニューには機能を増やさない（ユーザー明言）。フォルダ内サムネのコラージュSNS共有は**不採用**（再提案しない）。
- **iCloud バックアップ（Pro）**: 実装完了・実機動作確認済み（`react-native-cloud-storage` v3、コンテナ `iCloud.com.sknk.foldersapp`、entitlement environment=Production）。**v3 に iOS SIGABRT クラッシュの上流バグ（#59）あり** → `scripts/patch-cloud-storage.js`（postinstall）で回避済み。**ライブラリ更新時はこのパッチが当たるか／上流修正されたか要確認**。TestFlight 本番ビルドは `__DEV__=false` で `DEV_FORCE_PRO` が効かない点に注意（Pro機能テストはサンドボックスIAP等が必要）。
- **Share Extension Phase 2**（フォルダ選択・サムネキャプチャを拡張内で完結）は保留項目。現状は URL確認＋サイト名入力のみ→本体アプリで完結する2段階フロー。要望が出たら App Group 経由のネイティブブリッジで実装。

## 識別子・配信

- Bundle ID: `com.sknk.foldersapp`（拡張 `com.sknk.foldersapp.ShareExtension`）
- App Group: `group.com.sknk.foldersapp` / iCloud コンテナ: `iCloud.com.sknk.foldersapp`
- URL Scheme: `foldersapp://` / Expo Owner: `sknk-aaa` / EAS Project ID: `df21cc8c-6420-4d64-86d5-07d76249ab28`
- 課金（RevenueCat entitlement `Bookrest Pro`）: 買い切り `com.sknk.foldersapp.pro` ＋ 月額 `com.sknk.foldersapp.pro.monthly`。無料上限はブックマーク100件（警告90）・フォルダ5個。Pro限定=メモ/ダークテーマ/iCloud。
- CI: `.github/workflows/ios.yml`（push or 手動 `gh workflow run ios.yml` → fastlane → TestFlight）、`ios-certs.yml`（初回証明書）。

## doc索引（docs/・丸写し禁止・最新はここを参照）

- `docs/DESIGN.md` — データモデル（folders/bookmarks/settings）・ビジネスルール・画面仕様・パレット
- `docs/OPERATIONS.md` — 固定識別子・バージョン運用・ビルド/配信手順・IAP/RevenueCat・iCloud セットアップ・注意事項
- `docs/HANDOFF.md` — 現状・実装済み一覧・残タスク・既知の問題（最新状態の正）
- `docs/MARKETING.md` — ストア訴求・ASO・SNS/動画台本・価格/スクショAB案
