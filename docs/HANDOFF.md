# サムネブクマ 現状・残タスク

## 現在の状態

**v1.5.0 を App Store Connect に提出済み（2026-06-04）。** 主要言語は日本語のまま提出。
ビルドは GitHub Actions（push → fastlane → TestFlight）。build number は CI 自動採番（`GITHUB_RUN_NUMBER + 100`）。

- 公開中: v1.2.0（30件上限・ライトのみ・日本語のみ）
- 提出済み: v1.5.0（下記の大型アップデート）

---

## 実装済み（v1.5.0 で追加された主な機能）

| 機能 | 内容 |
|---|---|
| メモ（Pro） | ブックマークにメモ。アプリ内（追加/編集）＋ Share Extension で入力。`bookmarks.memo` |
| ダークモード（Pro） | テーマ自体をPro限定。無料はライト固定。`useTheme()` が `!is_premium` でライトを返す |
| 3表示モード | grid / list / photo（正方形サムネ）。ピンチで列密度変更 |
| 積ん読リマインダー（通知） | 週1で未読（タップ0回=`viewed_at` null）を通知。設定トグル＋オンボ最後で許可。expo-notifications |
| Pro購入画面の刷新 | モーダル→ナビゲーション画面（`ProUpgradeScreen`）。機能ショーケース画像＋プラン選択UI＋単一購入ボタン |
| 2プラン課金 | 買い切り `com.sknk.foldersapp.pro` ＋ 月額 `com.sknk.foldersapp.pro.monthly`。RevenueCat entitlement `Bookrest Pro` |
| 無料上限 | ブックマーク 100件（警告90件）・フォルダ 5個 |
| i18n（端末言語で日英自動切替） | `src/shared/i18n` の `tr({en,ja})`。日本語端末→日本語、他→英語。iOS標準のアプリ別言語に追従 |
| アプリ名ローカライズ | ホーム画面名 日本語端末=サムネブクマ / 英語端末=Bookrest（`ios/Bookrest/{ja,en}.lproj/InfoPlist.strings`） |
| オンボーディング | 全4ページ。02=共有保存の動画、03=表示モードの動画（expo-video、ループ/ミュート/再生中バッジ＋プログレスバー） |
| iCloudバックアップ（Pro） | 実機で動作確認済み |

過去フェーズ（Phase1: CRUD/グリッド/検索/SQLite、Phase2: Share Extension、Phase3: チュートリアル/RevenueCat連携）は既存どおり。

---

## 残タスク

### 🔴 審査通過後にやる

| タスク | 詳細 |
|---|---|
| 英語プライマリへ切替 | **1.5.0 審査通過後**、App Store Connect の主要言語を英語に。併せてバイナリ既定も反転（base `CFBundleDisplayName`→Bookrest、許可文→英語、`CFBundleDevelopmentRegion`→en、日本語を `ja.lproj` へ）。海外展開の増幅装置。それまでは日本語プライマリ維持（海外露出を抑える方針） |

### 🟡 任意・様子見

| タスク | 詳細 |
|---|---|
| 依存の版ズレ | `npx expo install --check` で `react-native-view-shot`（5.1.0 vs 推奨4.0.3）等。サムネ保存に問題が出たら揃える |
| AdMob広告 | 現状ペンディング（無料版バナー構想。未実装） |

---

## 既知の問題・ハマりどころ

### 通知が SDK 非互換でクラッシュ（解決済み・再発注意）
`expo-notifications` を素の `npm install` で入れると SDK54 非互換の最新メジャー（v56）が入り、通知許可時に **SIGABRT**。**必ず `npx expo install` で入れる**こと（正版 `~0.32.17`）。

### バージョン表記は Info.plist を手動更新
CI（fastlane）は `CFBundleVersion`（ビルド番号）のみ自動採番。**`CFBundleShortVersionString`（表示版）は committed の `Info.plist` 値がそのまま出る**ため、版を上げる時は `ios/Bookrest/Info.plist` と `ios/BookrestShareExtension/Info.plist` の両方を手で更新する（拡張とメインは一致必須）。

### Share Extension のキーボード
入力時にシートが上がりすぎ/隠れる問題は、`KeyboardAvoidingView` を外し ScrollView に `automaticallyAdjustKeyboardInsets` を付けて対応。Metro では確認不可、要ビルド。

### ネイティブモジュールは旧 dev client で落ちる
expo-localization / expo-video / expo-notifications は古い dev client に無いと起動クラッシュ。`i18n/index.ts`・`TutorialScreen`・`notifications/engine.ts` で require ガード済み（未搭載時フォールバック）。本番は全搭載で正常。

### Share Extension URL取得失敗（一部サイト・未解決）
NAVITIME等でURL自動取得が失敗することがある。`preprocessing.js` に防御策済みだが根本未特定。「一部サイトは手入力」の既知制限。

---

## 主要ファイルマップ（抜粋・v1.5.0）

```
src/
├── features/
│   ├── folders/ … HomeScreen / FolderDetailScreen / FolderEditModal / store
│   ├── bookmarks/ … AddBookmarkScreen(上限ロジック→ProUpgradeへ navigate) / BookmarkCard / store
│   ├── pro/
│   │   ├── screens/ProUpgradeScreen.tsx        購入“ページ”（旧モーダルから移行）
│   │   └── store.ts                            RevenueCat。DEV_FORCE_PRO / DEV_FORCE_FREE（本番は__DEVで無効）
│   ├── notifications/engine.ts                 週1通知（require ガード）
│   ├── backup/ …                               iCloudバックアップ（Pro）
│   ├── settings/store.ts                       theme_mode / notification_enabled 等
│   └── tutorial/TutorialScreen.tsx             オンボ4ページ（動画2本）
├── shared/
│   ├── i18n/index.ts                           tr({en,ja}) 端末言語で日英切替
│   ├── components/DrawerContent.tsx
│   ├── db/migrations.ts                        memo / viewed_at 列追加（ALTER）
│   ├── theme.ts                                useTheme() がPro限定でダーク
│   └── types/index.ts
├── navigation/index.tsx                        ProUpgrade ルート登録
ShareExtension.tsx                              ← preprocessing.js は ios/ 配下と同期必須
ios/Bookrest/{ja,en}.lproj/InfoPlist.strings    アプリ名ローカライズ（pbxprojに手動登録済み）
fastlane/Fastfile                               CFBundleVersionのみ自動採番
docs/{index,faq}.html                           ランディング/FAQ（英日併記）
```
