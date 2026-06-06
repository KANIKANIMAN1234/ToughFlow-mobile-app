"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

const FIELD_USERS = [
  { name: "七瀬", project: "キャステック第三工場 ガンドリル搬入" },
  { name: "佐藤", project: "吉田電工 キューピクル搬入" },
];

function LineMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M19.5 4.5H4.5A4.5 4.5 0 0 0 0 9v6a4.5 4.5 0 0 0 4.5 4.5h15A4.5 4.5 0 0 0 24 15V9a4.5 4.5 0 0 0-4.5-4.5Zm-2.2 9.8h-1.6l-2.5-3.3v3.3H9.6V9.7h3.1c1.5 0 2.4.8 2.4 2.1 0 1-.5 1.7-1.4 2l2.8 3.5ZM12.7 11c0-.6-.4-1-1.1-1h-1.2v2.1h1.2c.7 0 1.1-.3 1.1-1.1Zm5.6 3.3h-1.5V9.7H18v4.6Z" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  const [tenantCode, setTenantCode] = useState("TOTSUKA");
  const [userName, setUserName] = useState(FIELD_USERS[0].name);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lineEnabled, setLineEnabled] = useState(false);

  useEffect(() => {
    const queryError = searchParams.get("error");
    if (queryError) setError(queryError);
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user) router.replace("/home");
  }, [authLoading, user, router]);

  useEffect(() => {
    fetch("/api/auth/line/config")
      .then((res) => res.json())
      .then((data: { enabled?: boolean }) => setLineEnabled(Boolean(data.enabled)))
      .catch(() => setLineEnabled(false));
  }, []);

  function handleLineLogin() {
    setError("");
    const code = tenantCode.trim();
    if (!code) {
      setError("会社コードを入力してください");
      return;
    }
    const returnTo = searchParams.get("returnTo");
    const params = new URLSearchParams({ tenantCode: code });
    if (returnTo?.startsWith("/")) params.set("returnTo", returnTo);
    window.location.href = `/api/auth/line?${params.toString()}`;
  }

  async function handleDemoLogin() {
    setError("");
    setLoading(true);
    try {
      await login(tenantCode, userName);
      router.replace("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-mobile flex-col justify-center bg-surface px-6 py-12">
      <div className="mb-10 text-center">
        <p className="apple-heading text-headline text-apple-text">ToughFlow</p>
        <p className="mt-2 text-caption text-apple-glyph">現場向けモバイル</p>
      </div>

      <div className="space-y-4 rounded-card border border-surface-border bg-white p-6">
        <Input
          label="会社コード"
          value={tenantCode}
          onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
          hint="初回ログイン時に入力（例: TOTSUKA）"
        />

        <button
          type="button"
          onClick={handleLineLogin}
          disabled={!lineEnabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-[#06C755] px-[22px] py-3 text-body font-normal text-white transition-colors hover:bg-[#05b34c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LineMark />
          LINEでログイン
        </button>

        {!lineEnabled && (
          <p className="text-center text-nav-link text-apple-glyph">
            LINE Login は環境変数設定後に有効になります
          </p>
        )}

        {error && <p className="text-caption text-red-600">{error}</p>}

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-surface-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-nav-link text-apple-glyph">
              開発用ログイン
            </span>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-apple-text">現場従業員</span>
          <select
            className="w-full rounded-xl border border-surface-border px-3 py-3 text-caption"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          >
            {FIELD_USERS.map((u) => (
              <option key={u.name} value={u.name}>
                {u.name}（{u.project}）
              </option>
            ))}
          </select>
        </label>

        <Button fullWidth variant="secondary" disabled={loading} onClick={handleDemoLogin}>
          {loading ? "ログイン中…" : "デモでログイン"}
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-caption text-apple-glyph">
          読み込み中…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
