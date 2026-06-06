"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

type Props = {
  lineEnabled: boolean;
};

function LoginFormInner({ lineEnabled }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  const [tenantCode, setTenantCode] = useState("TOTSUKA");
  const [userName, setUserName] = useState(FIELD_USERS[0].name);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryError = searchParams.get("error");
    if (queryError) setError(queryError);
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user) {
      const returnTo = searchParams.get("returnTo");
      router.replace(returnTo?.startsWith("/") ? returnTo : "/home");
    }
  }, [authLoading, user, router, searchParams]);

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
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-sm">
          <Image
            src="/icon.png"
            alt="ToughFlow"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <p className="apple-heading text-headline text-apple-text">ToughFlow</p>
        <p className="mt-2 text-caption text-apple-glyph">現場向けモバイル</p>
      </div>

      <div className="space-y-4 rounded-card border border-surface-border bg-white p-6 shadow-sm">
        <Input
          label="会社コード"
          value={tenantCode}
          onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
          hint={lineEnabled ? "所属会社のコードを入力してください" : "例: TOTSUKA"}
          autoComplete="organization"
        />

        {lineEnabled ? (
          <>
            <button
              type="button"
              onClick={handleLineLogin}
              className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-[#06C755] px-[22px] py-3.5 text-body font-medium text-white transition-colors hover:bg-[#05b34c] active:bg-[#049e44] focus-apple"
            >
              <LineMark />
              LINEでログイン
            </button>
            <p className="text-center text-nav-link text-apple-glyph">
              LINEアカウントで認証します。初回は表示名でユーザー登録されます。
            </p>
          </>
        ) : (
          <p className="rounded-xl bg-apple-section px-3 py-2 text-center text-nav-link text-apple-glyph">
            LINE Login が未設定のため、下の開発用ログインをご利用ください。
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-caption text-red-600">
            {error}
          </p>
        )}

        {!lineEnabled && (
          <>
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

            <Button
              fullWidth
              variant="secondary"
              disabled={loading}
              onClick={handleDemoLogin}
            >
              {loading ? "ログイン中…" : "デモでログイン"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function LoginForm({ lineEnabled }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-caption text-apple-glyph">
          読み込み中…
        </div>
      }
    >
      <LoginFormInner lineEnabled={lineEnabled} />
    </Suspense>
  );
}
