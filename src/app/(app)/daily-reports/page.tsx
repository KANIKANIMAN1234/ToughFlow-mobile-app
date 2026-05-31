"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import type { DailyReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function DailyReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ reports: DailyReport[] }>(`/api/daily-reports?userId=${user.id}`)
      .then((d) => setReports(d.reports));
  }, [user]);

  if (loading || !user) return null;

  return (
    <AppShell title="作業日報一覧">
      <Link href="/daily-reports/new">
        <Button fullWidth className="mb-4">
          ＋ 新規入力
        </Button>
      </Link>
      <div className="space-y-3">
        {reports.map((r) => (
          <Card key={r.id}>
            <p className="font-semibold">{r.content.billingClient}</p>
            <p className="text-xs text-slate-500">
              {formatDate(r.content.workDateStart)} · {r.projectName}
            </p>
            <p className="mt-1 text-xs text-brand-600">{r.status}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
