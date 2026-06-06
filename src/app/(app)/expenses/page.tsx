"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { Expense } from "@/lib/types";
import { formatDate, formatYen } from "@/lib/utils";

export default function ExpensesPage() {
  const { user, authLoading } = useAuthGuard();
  const { data, isLoading } = useApi<{ expenses: Expense[] }>(
    user ? `/api/expenses?userId=${user.id}` : null
  );

  const expenses = data?.expenses ?? [];

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
                <p className="font-normal text-brand-600">
                  {formatYen(e.amount)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
