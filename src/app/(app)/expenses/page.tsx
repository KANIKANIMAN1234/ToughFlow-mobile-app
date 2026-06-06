"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { api } from "@/lib/api/client";
import type { Expense } from "@/lib/types";
import { formatDate, formatYen } from "@/lib/utils";

const statusLabel: Record<Expense["status"], string> = {
  draft: "下書き",
  submitted: "提出済",
  approved: "承認済",
  rejected: "差戻し",
};

export default function ExpensesPage() {
  const { user, authLoading } = useAuthGuard();
  const { data, isLoading, mutate } = useApi<{ expenses: Expense[] }>(
    user ? `/api/expenses?userId=${user.id}` : null
  );
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const expenses = data?.expenses ?? [];
  const draftCount = expenses.filter((e) => e.status === "draft").length;

  async function handleBatchSubmit() {
    if (!user || draftCount === 0) return;
    setBatchSubmitting(true);
    try {
      await api.post("/api/expenses/submit-batch", {});
      await mutate();
    } finally {
      setBatchSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <AppShell title="立替精算一覧">
        <CardListSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="立替精算一覧">
      <Link href="/expenses/new">
        <Button fullWidth className="mb-4">
          ＋ 新規登録
        </Button>
      </Link>
      {draftCount > 0 && (
        <Button
          variant="secondary"
          fullWidth
          className="mb-4"
          disabled={batchSubmitting}
          onClick={() => void handleBatchSubmit()}
        >
          {batchSubmitting
            ? "提出中…"
            : `月末一括提出（下書き ${draftCount}件）`}
        </Button>
      )}
      {isLoading && !data ? (
        <CardListSkeleton />
      ) : (
        <div className="space-y-3">
          {expenses.length === 0 && (
            <p className="text-center text-caption text-apple-glyph">
              登録がありません
            </p>
          )}
          {expenses.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-normal text-apple-text">{e.projectName}</p>
                  <p className="text-nav-link text-apple-glyph">
                    {formatDate(e.expenseDate)} · {e.categoryName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-normal text-brand-600">
                    {formatYen(e.amount)}
                  </p>
                  <p className="text-xs text-apple-glyph">
                    {statusLabel[e.status]}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
