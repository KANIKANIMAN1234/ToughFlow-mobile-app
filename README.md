# ToughFlow Mobile

戸塚重量向け **ToughFlow** の現場用モバイル Web アプリ（Next.js App Router）。

P1 機能（SC-001, SC-010, SC-020, SC-030, SC-040, SC-050）に対応。

## 表示モード（NFR-009）

Top バーの **スマホ / iPad** トグルで UI を切り替えます（`localStorage` に表示モードのみ保存）。

| モード | シェル | 作業日報 | 現地調査 |
|--------|--------|----------|----------|
| スマホ | 480px・ドロワーメニュー | `DailyReportWizard` | `SiteSurveyWizard` |
| iPad | Top タブナビ・全幅 | `DailyReportScrollForm` | `SiteSurveyScrollForm` |

## 技術スタック

- Next.js 15（App Router）
- React 19 / TypeScript
- Tailwind CSS（モバイルファースト、max-width 480px）
- Supabase PostgreSQL（`repository` 層経由）
- LINE Login（本番 OAuth）
- SWR キャッシュ

## 画面一覧

| パス | 画面 | 仕様 |
|------|------|------|
| `/login` | ログイン | SC-001（LINE Login / 開発用デモ） |
| `/home` | ホーム | SC-010（未提出リマインド） |
| `/expenses/new` | 立替精算登録 | SC-020（OCR デモ） |
| `/expenses` | 立替精算一覧 | SC-021 |
| `/daily-reports/new` | 作業日報入力 | SC-030 |
| `/daily-reports` | 作業日報一覧 | SC-031 |
| `/site-surveys/new` | 現地調査入力 | SC-040 |
| `/site-surveys` | 現地調査一覧 | — |
| `/projects` | 案件一覧 | SC-050 |

## 認証

| 方式 | 条件 |
|------|------|
| LINE Login | 環境変数設定時（本番） |
| デモログイン | LINE 未設定時（会社コード + 現場従業員選択） |

## 権限

- ナビゲーションは権限矩阵に基づき表示（`partner` は現地調査閲覧のみ等）
- API はロール矩阵 + 個人上書きを反映して 403 を返却

## セットアップ

```bash
git clone https://github.com/KANIKANIMAN1234/ToughFlow-mobile-app.git
cd ToughFlow-mobile-app
cp .env.example .env.local
# .env.local に Supabase / LINE の値を設定
pnpm install
pnpm dev
```

http://localhost:3000

## 環境変数

| 変数 | 必須 | 説明 |
|------|:----:|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | anon キー |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | サーバー側 DB アクセス |
| `LINE_CHANNEL_ID` | 本番 | LINE Login |
| `LINE_CHANNEL_SECRET` | 本番 | LINE Login |
| `LINE_CALLBACK_URL` | 本番 | OAuth コールバック URL |
| `OPENAI_API_KEY` | 将来 | OCR・音声整形（未連携） |

## ディレクトリ構成

```
src/
├── app/              # ページ・API Routes
├── components/       # UI・ウィザード（phone / iPad 版）
├── contexts/         # 認証・表示モード
├── hooks/            # ウィザード・権限・API
├── lib/
│   ├── db/           # repository（Supabase）
│   ├── line/         # LINE OAuth
│   ├── permissions/  # 権限矩阵・チェック
│   └── types/        # 共通型定義
```

## 開発コマンド

```bash
pnpm dev        # 開発サーバー
pnpm build      # 本番ビルド
pnpm typecheck  # 型チェック
pnpm lint       # ESLint
```
