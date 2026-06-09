"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ExpenseListSection } from "@/components/expense/ExpenseListSection";
import { Button } from "@/components/ui/Button";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { api } from "@/lib/api/client";
import type { Expense } from "@/lib/types";

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
      <ExpenseListSection
        expenses={expenses}
        isLoading={isLoading && !data}
      />
    </AppShell>
  );
}
