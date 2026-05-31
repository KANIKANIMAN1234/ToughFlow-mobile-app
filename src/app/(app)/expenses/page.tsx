"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import type { Expense } from "@/lib/types";
import { formatDate, formatYen } from "@/lib/utils";

export default function ExpensesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ expenses: Expense[] }>(`/api/expenses?userId=${user.id}`)
      .then((d) => setExpenses(d.expenses));
  }, [user]);

  if (loading || !user) return null;

  return (
    <AppShell title="立替精算一覧">
      <Link href="/expenses/new">
        <Button fullWidth className="mb-4">
          ＋ 新規登録
        </Button>
      </Link>
      <div className="space-y-3">
        {expenses.length === 0 && (
          <p className="text-center text-sm text-slate-500">
            登録がありません
          </p>
        )}
        {expenses.map((e) => (
          <Card key={e.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{e.projectName}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(e.expenseDate)} · {e.categoryName}
                </p>
              </div>
              <p className="font-bold text-brand-700">{formatYen(e.amount)}</p>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
