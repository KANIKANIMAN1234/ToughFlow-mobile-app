"use client";

import { Card } from "@/components/ui/Card";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import type { Expense } from "@/lib/types";
import { formatDate, formatYen } from "@/lib/utils";

const statusLabel: Record<Expense["status"], string> = {
  draft: "下書き",
  submitted: "提出済",
  approved: "承認済",
  rejected: "差戻し",
};

type Props = {
  expenses: Expense[];
  isLoading?: boolean;
  title?: string;
};

export function ExpenseListSection({
  expenses,
  isLoading = false,
  title = "立替精算一覧",
}: Props) {
  if (isLoading) {
    return (
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-apple-text">{title}</h2>
        <CardListSkeleton />
      </section>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-semibold text-apple-text">{title}</h2>
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <p className="text-center text-caption text-apple-glyph">
            登録がありません
          </p>
        ) : (
          expenses.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-normal text-apple-text">
                    {e.projectName}
                  </p>
                  <p className="text-nav-link text-apple-glyph">
                    {formatDate(e.expenseDate)} · {e.categoryName}
                  </p>
                  {e.memo && (
                    <p className="mt-1 truncate text-xs text-apple-glyph">
                      {e.memo}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-normal text-brand-600">
                    {formatYen(e.amount)}
                  </p>
                  <p className="text-xs text-apple-glyph">
                    {statusLabel[e.status]}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
