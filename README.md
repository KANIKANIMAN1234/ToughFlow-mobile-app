# ToughFlow Mobile

戸塚重量向け **ToughFlow** の現場用モバイル Web アプリ（Next.js App Router）。

P1 機能（SC-001, SC-010, SC-020, SC-030, SC-040, SC-050）に対応した UI 実装です。

## 表示モード（NFR-009）

Top バーの **スマホ / iPad** トグルで UI を切り替えます（`localStorage` に保存）。

| モード | シェル | 作業日報 | 現地調査 |
|--------|--------|----------|----------|
| スマホ | 480px・ドロワーメニュー | `DailyReportWizard`（現行） | `SiteSurveyWizard`（現行） |
| iPad | Sidebar 常時表示・全幅 | `DailyReportWizardIpad` | `SiteSurveyWizardIpad` |

## 技術スタック

- Next.js 15（App Router）
- React 19 / TypeScript
- Tailwind CSS（モバイルファースト、max-width 480px）
- デモ API（localStorage + Route Handlers）

## 画面一覧

| パス | 画面 | 仕様 |
|------|------|------|
| `/login` | ログイン | SC-001（デモ: 会社コード + 名前） |
| `/home` | ホーム | SC-010 |
| `/expenses/new` | 立替精算登録 | SC-020（OCR デモ） |
| `/expenses` | 立替精算一覧 | SC-021 |
| `/daily-reports/new` | 作業日報入力（6ステップ） | SC-030 |
| `/daily-reports` | 作業日報一覧 | SC-031 |
| `/site-surveys/new` | 現地調査入力 | SC-040 |
| `/site-surveys` | 現地調査一覧 | — |
| `/projects` | 案件一覧 | SC-050 |

## マスタ（seed）

テナントマスタ（REQ-115）の初期値を API から返却します。

- **M1** 作業種別 9種（原紙 IMG_5182）
- **M2** 車両・重機 15種
- **M3** 資材 7行
- **M4** 現地調査作業種別 3種
- **M5** 必要道具 19種
- **M7** 経費科目

## セットアップ

```bash
git clone https://github.com/KANIKANIMAN1234/ToughFlow-mobile-app.git
cd ToughFlow-mobile-app
cp .env.example .env.local
pnpm install   # npm でエラーが出る場合は pnpm を使用
pnpm dev
```

ブラウザで http://localhost:3000 を開き、会社コード `TOTSUKA` でログイン。

## 本番連携（今後）

| 項目 | 対応 |
|------|------|
| 認証 | LINE Login + Supabase Auth |
| DB | Supabase PostgreSQL（RLS） |
| OCR | OpenAI Vision API |
| ファイル | Google Drive API |
| デプロイ | Vercel |

環境変数は `.env.example` を参照してください。

## ディレクトリ構成

```
src/
├── app/              # ページ・API Routes
├── components/       # UI・ウィザード（phone / iPad 版）
├── contexts/         # 認証・表示モード
├── hooks/            # 日報・現地調査ウィザード共通ロジック
└── lib/
    ├── api/          # fetch ラッパ
    ├── seed/         # マスタ seed
    ├── store/        # デモ用ストア
    └── types/        # 型定義
```

## 開発コマンド

```bash
pnpm dev        # 開発サーバー
pnpm build      # 本番ビルド
pnpm typecheck  # 型チェック
pnpm lint       # ESLint
```
