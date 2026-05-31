"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_TENANT_CODE } from "@/lib/seed/masters";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tenantCode, setTenantCode] = useState(DEMO_TENANT_CODE);
  const [userName, setUserName] = useState("七瀬");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
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
    <div className="mx-auto flex min-h-screen max-w-mobile flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <p className="text-3xl font-black tracking-tight text-brand-700">
          ToughFlow
        </p>
        <p className="mt-2 text-sm text-slate-500">
          現場向けモバイル（P1）
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-surface-border bg-white p-6 shadow-sm">
        <Input
          label="会社コード"
          value={tenantCode}
          onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
          hint={`デモ: ${DEMO_TENANT_CODE}`}
        />
        <Input
          label="お名前"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="現場担当者名"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button fullWidth disabled={loading} onClick={handleLogin}>
          {loading ? "ログイン中…" : "LINE Login（デモ）"}
        </Button>
        <p className="text-center text-xs text-slate-400">
          本番環境では LINE Login + 会社コード入力に置き換えます
        </p>
      </div>
    </div>
  );
}
