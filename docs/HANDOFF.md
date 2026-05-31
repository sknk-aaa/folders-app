# サムネブクマ 現状・残タスク

## 現在の状態

v1.2.0 をApp Store Connectに提出済み（2026-05-26）。
build number 22、EAS build ID `e3c7f24f-36f5-4fd5-8d11-4ac1d0208d47`。

---

## 実装済み

| フェーズ | 内容 |
|---|---|
| Phase 1 | フォルダ/ブックマークCRUD、グリッド/リスト表示、並び替え、検索、SQLite永続化 |
| Phase 2 | Share Extension（expo-share-extension v5、App Group経由） |
| Phase 3 | チュートリアル（5ページスワイプ）、30件上限 + Proモーダル、RevenueCat連携 |
| その他 | アプリアイコン・スプラッシュ、ドロワーメニュー（レビュー・FAQ・設定） |

---

## 残タスク

### 🔴 高優先

| タスク | 詳細 |
|---|---|
| Pro課金フロー実装 | RevenueCat は設定済み。App Store Connect でプロダクト登録 + 購入・復元フロー実装が必要 |
| AdMob広告 | `react-native-google-mobile-ads` 追加 → HomeScreen下部バナー（無料版のみ）。EAS Build が必要 |

### 🟡 中優先

| タスク | 詳細 |
|---|---|
| NAVITIME URL問題 | 一部サイトでShare Extension経由のURL自動取得が失敗（詳細↓） |
| オンボーディング page 1 | `assets/onboarding/welcome.png` を上部が自然に見える構図に差し替え |

### 🟢 低優先

| タスク | 詳細 |
|---|---|
| （他に追加があればここへ） | |

### 進行中: iCloudバックアップ（Pro）

`react-native-cloud-storage` v3 で実装中。

- **フェーズ1（ローカル検証）完了**: 保存先を抽象化(`src/features/backup/storage/`)、バックアップ/復元エンジン(`engine.ts`)を実装し、dev build + Metro で復元ロジックを実機検証済み。
- **フェーズ2（iCloud実装）コード完了・未ビルド**: iCloudバックエンド実装、エンタイトルメント手動追記済み。**残：Developer Portalでコンテナ作成 → EAS dev build で実地確認 → 本番**。手順は [OPERATIONS.md](OPERATIONS.md) の「iCloudバックアップ セットアップ手順」参照。
- 注意: dev=environment `Development` / 本番=`Production` に entitlements を切り替える。`DEV_FORCE_PRO` は本番前に false へ。

---

## 既知の問題

### Share Extension URL取得失敗（一部サイト）

NAVITIMEの路線時刻表ページ等、一部サイトでURLが自動取得できない。

**現状**: `preprocessing.js` に `fallbackUrl` の防御的修正を入れたが、development buildでも解消しなかった。根本原因は未特定。v1.2.0では「一部サイトでURL手入力が必要な既知の制限」として提出。

**次のアクション**:
1. `ShareExtensionViewController.swift` 側に診断情報（受信データのダンプ）を仕込む
2. 診断を含む development build を作り、同一ページで Safari から共有して確認
3. PC側のMetroログには出ない想定で調査する

---

## 主要ファイルマップ

```
src/
├── features/
│   ├── folders/
│   │   ├── components/FolderCard.tsx           フォルダカード（モザイクサムネ）
│   │   ├── components/SortableFolderGrid.tsx   ドラッグ並び替えグリッド
│   │   ├── components/FolderEditModal.tsx       フォルダ名・カバー編集
│   │   ├── screens/HomeScreen.tsx              ホーム
│   │   ├── screens/FolderDetailScreen.tsx      フォルダ詳細
│   │   └── store.ts
│   ├── bookmarks/
│   │   ├── components/BookmarkCard.tsx
│   │   ├── components/BookmarkEditModal.tsx
│   │   ├── screens/AddBookmarkScreen.tsx       上限ロジック・Proモーダル起点
│   │   ├── screens/TrimScreen.tsx
│   │   ├── screens/AllBookmarksScreen.tsx
│   │   └── store.ts
│   ├── pro/
│   │   └── components/ProUpgradeModal.tsx
│   ├── settings/
│   │   └── store.ts
│   └── tutorial/
│       └── TutorialScreen.tsx
├── shared/
│   ├── components/Header.tsx
│   ├── components/DrawerContent.tsx
│   ├── db/client.ts
│   ├── db/migrations.ts                       スキーマ・初期データ（シード）
│   ├── mockVisuals.ts                         サンプルブックマーク定義
│   └── types/index.ts
├── navigation/index.tsx
ShareExtension.tsx                             Share Extension エントリポイント
preprocessing.js                               ← 変更時は ios/ 配下と必ず同期
ios/BookrestShareExtension/preprocessing.js    Safari内で実行される実体
docs/
├── faq.html                                   FAQページ（Webランディング）
├── index.html                                 ランディングページ
```
