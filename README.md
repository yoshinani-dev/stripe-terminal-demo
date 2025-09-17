# Stripe Terminal Demo

Stripe Terminalの決済をデモするための画面で、リーダー検出からカード決済までをブラウザ操作で体験できるNext.js製ダッシュボードです。テスト／本番の各モードに対応し、Server Actions経由で安全に決済フローを実行します。

## 概要

- 店舗向けのStripe Terminal決済管理UI
- Stripe Terminal JavaScript SDKをReact Hooksでラップし、初期化から決済完了までを一貫管理
- Next.js App Router + Server Actionsでコネクション／決済インテントをサーバーサイドから生成
- 環境変数でテスト・本番モードを切り替え、モードに応じたシミュレーター利用制御を実施

## 主な機能

- リーダー検出・接続状況と支払い進行度のリアルタイム表示
- 金額入力、決済実行、キャンセル、ディスプレイクリアなどの基本オペレーション
- 予期せぬリーダー切断時のリカバリーとエラー表示
- 本番モードではシミュレーターを自動無効化して実機利用を促す安全設計

## 技術スタック

- Next.js 15（App Router, Server Actions）
- React 19 / TypeScript
- Stripe Terminal JavaScript SDK
- Tailwind CSS 4, Framer Motion, Lucide Icons

## 前提条件

- Node.js 18+ と [pnpm](https://pnpm.io/)
- Stripeアカウント（Stripe Terminalが有効化されていること）
- Stripe認定リーダー（WisePOS E / BBPOS WisePad 3 等）またはStripe Terminalシミュレーター
- 利用地域がStripe Terminalの提供エリアであること

## 環境変数

| 変数名 | 必須 | 説明 | 例 | 参照範囲 |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe公開可能キー。モードごとに`pk_test_`/`pk_live_`を設定 | `pk_test_123` | クライアント / サーバー |
| `STRIPE_SECRET_KEY` | ✅ | Stripeシークレットキー。Server Actionsから利用 | `sk_test_123` | サーバーのみ |
| `NEXT_PUBLIC_STRIPE_LOCATION_ID` | 推奨 | Stripe TerminalのLocation ID。設定すると該当ロケーションでリーダー検出 | `tml_123` | クライアント / サーバー |
| `NEXT_PUBLIC_STRIPE_MODE` | 推奨 | `test` または `live`。`live`時はシミュレーターUIが無効化 | `test` | クライアント / サーバー |

### 開発用 `.env.local`

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_LOCATION_ID=tml_xxxxx # 任意（シミュレーター利用時は不要）
NEXT_PUBLIC_STRIPE_MODE=test
```

### 本番用 `.env.production` など

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_LOCATION_ID=tml_xxxxx
NEXT_PUBLIC_STRIPE_MODE=live
```

## ローカル開発手順

```bash
# 依存関係をインストール
pnpm install

# 環境変数ファイルを用意
# 例: cp .env.local.example .env.local （サンプルがある場合）
# または新規に .env.local を作成し上記値を設定

# 開発サーバーを起動
pnpm dev
```

推奨フロー：

1. **開発**：テストキー + シミュレーター
2. **ステージング**：テストキー + 実機リーダー
3. **本番**：本番キー + 実機リーダー

## Stripe Dashboard設定手順

### 1. APIキーの取得

1. [Stripe Dashboard](https://dashboard.stripe.com/)へログイン
2. サイドバーの**開発者** → **APIキー**を開く
3. テスト／本番それぞれで公開可能キー(`pk_...`)とシークレットキー(`sk_...`)をコピー

### 2. Location IDの作成

1. Dashboardで対象モードを選択（テスト・本番）
2. **Terminal** → **Locations** → **+ New location**
3. 店舗情報を登録しLocation IDを発行
4. `tml_`で始まるIDを環境変数に設定

## デプロイ / 本番運用

```bash
# 本番ビルド
pnpm build

# 本番起動
pnpm start
```

Vercelなどのホスティングでは、上記4種の環境変数を必ず設定してください。`NEXT_PUBLIC_STRIPE_MODE=live` に設定すると、アプリ側でシミュレーターの利用が抑制されます。

## 運用時の注意事項

- **リーダー要件**：Stripe認定リーダー（WisePOS E、BBPOS WisePad 3など）または専用iOS端末
- **地域制限**：Stripe Terminal提供地域のみ利用可能
- **通信要件**：本番運用では常時HTTPS接続と安定したネットワークが必要
- **シミュレーター制限**：ライブキーではStripe公式仕様としてシミュレーター非対応

## セキュリティベストプラクティス

- 環境変数はGitにコミットせずSecret Manager等で安全に保管
- 本番環境のアクセス権限を最小限に絞る（Location設定含む）
- Stripe Dashboardでログ監視・アラート設定を行い不正取引を検知

## 本番移行チェックリスト

- [ ] 本番用APIキーを取得し環境変数を更新
- [ ] 本番用Location IDを作成・設定
- [ ] 実機リーダーとHTTPS環境で通信テスト済み
- [ ] 小額決済で本番動作を確認
- [ ] エラー通知／ログ監視体制を整備

## トラブルシューティング

**「Only test mode keys are allowed with the simulator」エラー**
- 解決策：テストキー(`pk_test_`)に切り替えるか実機リーダーを利用してください

**リーダーが検出されない**
- リーダーの電源・接続モード・ファームウェアを確認
- Location設定とリージョンが正しいか検証

**決済が失敗する**
- Stripe Dashboardのエラーログを参照
- ネットワーク状態とAPIキー／Location IDの整合性を確認

## 参考リンク

- [Stripe Terminal ドキュメント](https://docs.stripe.com/terminal)
- [Getting Started with Stripe Terminal](https://stripe.com/docs/terminal/overview)
- [Stripe Terminal（日本）提供状況](https://stripe.com/jp/terminal)
