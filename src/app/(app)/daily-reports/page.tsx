"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { DailyReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function DailyReportsPage() {
  const { user, authLoading } = useAuthGuard();
  const { data, isLoading } = useApi<{ reports: DailyReport[] }>(
    user ? `/api/daily-reports?userId=${user.id}` : null
  );

  const reports = data?.reports ?? [];

  if (authLoading || !user) {
    return (
      <AppShell title="作業日報一覧">
        <CardListSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="作業日報一覧">
      <Link href="/daily-reports/new">
        <Button fullWidth className="mb-4">
          ＋ 新規入力
        </Button>
      </Link>
      {isLoading && !data ? (
        <CardListSkeleton />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link key={r.id} href={`/daily-reports/${r.id}`}>
              <Card>
                <p className="font-normal text-apple-text">
                  {r.content.billingClient}
                </p>
                <p className="text-nav-link text-apple-glyph">
                  {formatDate(r.content.workDateStart)} · {r.projectName}
                </p>
                <p className="mt-1 text-xs text-brand-600">{r.status}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
