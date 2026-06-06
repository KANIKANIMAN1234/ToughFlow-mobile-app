"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "管理者",
  office: "事務",
  manager: "部長",
  field: "現場",
};

type LinkableUser = {
  id: string;
  name: string;
  role: UserRole;
};

type LinkContext = {
  displayName: string | null;
  tenantCode: string;
  tenantName: string;
  users: LinkableUser[];
};

export default function LineLinkPage() {
  const router = useRouter();
  const [context, setContext] = useState<LinkContext | null>(null);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/line/link", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "紐付け情報の取得に失敗しました");
        setContext(data as LinkContext);
        if (data.users?.length === 1) {
          setUserId(data.users[0].id);
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "紐付け情報の取得に失敗しました");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLink() {
    if (!userId) {
      setError("自分の名前を選択してください");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/line/link", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "紐付けに失敗しました");
      router.replace("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "紐付けに失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-caption text-apple-glyph">
        読み込み中…
      </div>
    );
  }

  if (!context) {
    return (
      <div className="mx-auto flex min-h-screen max-w-mobile flex-col justify-center bg-surface px-6 py-12">
        <div className="rounded-card border border-surface-border bg-white p-6 text-center">
          <p className="text-body text-red-600">{error || "紐付けセッションが無効です"}</p>
          <Button className="mt-4" onClick={() => router.replace("/login")}>
            ログイン画面へ戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-mobile flex-col justify-center bg-surface px-6 py-12">
      <div className="mb-8 text-center">
        <p className="apple-heading text-headline text-apple-text">アカウント紐付け</p>
        <p className="mt-2 text-caption text-apple-glyph">初回ログインの設定</p>
      </div>

      <div className="space-y-4 rounded-card border border-surface-border bg-white p-6 shadow-sm">
        <div className="rounded-xl bg-apple-section px-3 py-3 text-caption text-apple-text">
          <p>
            LINE認証は成功しました。
            {context.displayName ? (
              <>
                <br />
                LINE表示名: <strong>{context.displayName}</strong>
              </>
            ) : null}
          </p>
          <p className="mt-2 text-apple-glyph">
            {context.tenantName}（{context.tenantCode}）の登録ユーザーから、自分の名前を選んでください。
            次回から自動でログインできます。
          </p>
        </div>

        {context.users.length === 0 ? (
          <p className="text-caption text-red-600">
            紐付け可能なユーザーがありません。管理者にユーザー登録を依頼してください。
          </p>
        ) : (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-apple-text">あなたの名前</span>
            <select
              className="w-full rounded-xl border border-surface-border px-3 py-3 text-caption"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">選択してください</option>
              {context.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}（{ROLE_LABEL[u.role]}）
                </option>
              ))}
            </select>
          </label>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-caption text-red-600">{error}</p>
        )}

        <Button
          fullWidth
          disabled={submitting || context.users.length === 0}
          onClick={handleLink}
        >
          {submitting ? "紐付け中…" : "このユーザーでログイン"}
        </Button>

        <button
          type="button"
          className="w-full text-center text-nav-link text-apple-glyph underline"
          onClick={() => router.replace("/login")}
        >
          ログイン画面へ戻る
        </button>
      </div>
    </div>
  );
}
