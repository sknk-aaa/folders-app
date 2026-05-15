# 実機確認の手順

## どっちを使うか

```
コードを変更した
      │
      ├─ JS / TSX だけ変更 ────────────────→ Metro トンネルで即確認（EAS不要）
      │   （画面・ロジック・スタイル）
      │
      └─ ネイティブ側を変更 ──────────────→ EAS Build が必要
          （app.json, 新しいnpmパッケージ,
           ShareExtension.tsx, 権限追加）
```

---

## Metro トンネルで確認（JS変更のとき）

**PC:**
```bash
npx expo start --dev-client --tunnel
```

**iPhone:**
1. ホームから **folders-app（開発用）** を起動
2. 「Enter URL manually」→ 表示された `exp://xxxx.ngrok-free.app` を入力
3. 繋がればホットリロードで変更が即反映される

---

## EAS Build（ネイティブ変更のとき）

**PC:**
```bash
npx eas-cli build --platform ios --profile development
# 15〜20分かかる
```

**iPhone へのインストール:**
1. ビルド完了後、EAS ダッシュボードの Install URL を iPhone で開く
2. 「Install」をタップ
3. **アプリがホーム画面に出てこない場合** → プロファイルの信頼が必要:  
   設定 → 一般 → VPNとデバイス管理 → Apple Development: ... → 「信頼」

---

## 初期データを変えたとき（migrations.ts / mockVisuals.ts）

自動マイグレーションは「ユーザーがデータを触っていない」場合のみ動く。  
確実に反映させるには**アプリを削除して再インストール**。

1. iPhone でアプリを削除（長押し → 削除）
2. EAS Build のリンクから再インストール
3. 初回起動でシードデータが流れる

---

## よくあるトラブル

| 症状 | 対処 |
|---|---|
| `invalid tunnel configuration` エラー | `node scripts/patch-ngrok.js` を実行してから再起動 |
| アプリがホーム画面に出ない | 設定 → 一般 → VPNとデバイス管理 → 信頼 |
| JS の変更が反映されない | `--clear` オプション付きで再起動 |
| アプリがクラッシュ | ネイティブ変更ありなら EAS Build を再実行 |
