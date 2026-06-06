"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

const FIELD_USERS = [
  { name: "七瀬", project: "キャステック第三工場 ガンドリル搬入" },
  { name: "佐藤", project: "吉田電工 キューピクル搬入" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tenantCode, setTenantCode] = useState("TOTSUKA");
  const [userName, setUserName] = useState(FIELD_USERS[0].name);
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
          hint="例: TOTSUKA"
        />
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
        {error && <p className="text-caption text-red-600">{error}</p>}
        <Button fullWidth disabled={loading} onClick={handleLogin}>
          {loading ? "ログイン中…" : "ログイン"}
        </Button>
        <p className="text-center text-nav-link text-apple-glyph">
          m_user に登録されたユーザー名でログインします（LINE Login 連携予定）
        </p>
      </div>
    </div>
  );
}
