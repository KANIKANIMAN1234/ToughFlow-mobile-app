"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { DailyReport } from "@/lib/types";
import { formatDate, formatYen } from "@/lib/utils";

export default function DailyReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, authLoading } = useAuthGuard();
  const { data, isLoading } = useApi<{ report: DailyReport }>(
    user && id ? `/api/daily-reports?id=${id}` : null
  );

  const report = data?.report;

  if (authLoading || !user) {
    return (
      <AppShell title="作業日報詳細">
        <DetailSkeleton />
      </AppShell>
    );
  }

  if (isLoading && !report) {
    return (
      <AppShell title="作業日報詳細">
        <DetailSkeleton />
      </AppShell>
    );
  }

  if (!report) return null;

  const c = report.content;

  return (
    <AppShell title="作業日報詳細">
      <Card title="基本情報">
        <dl className="space-y-3 text-caption">
          <div>
            <dt className="text-apple-glyph">請求先</dt>
            <dd className="font-normal text-apple-text">{c.billingClient}</dd>
          </div>
          <div>
            <dt className="text-apple-glyph">作業日</dt>
            <dd>{formatDate(c.workDateStart)}</dd>
          </div>
          <div>
            <dt className="text-apple-glyph">納入先</dt>
            <dd>{c.delivery.company}</dd>
          </div>
          <div>
            <dt className="text-apple-glyph">担当</dt>
            <dd>{c.reporterName}</dd>
          </div>
          {c.remarks && (
            <div>
              <dt className="text-apple-glyph">備考</dt>
              <dd className="mt-1 whitespace-pre-wrap">{c.remarks}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card title="経費" className="mt-4">
        <dl className="space-y-2 text-caption">
          <div className="flex justify-between">
            <dt>高速代</dt>
            <dd>{c.costs.toll ? formatYen(c.costs.toll) : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt>ガソリン代</dt>
            <dd>{c.costs.gasoline ? formatYen(c.costs.gasoline) : "—"}</dd>
          </div>
        </dl>
      </Card>

      {c.machines.length > 0 && (
        <Card title="機械" className="mt-4">
          <ul className="space-y-1 text-caption">
            {c.machines.map((m, i) => (
              <li key={i}>
                {m.name} / {m.maker} / {m.model} × {m.qty}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {report.status === "submitted" && (
        <Card title="PDF" className="mt-4">
          <div className="flex gap-3">
            <a
              href={`/api/daily-reports/${id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl bg-apple-blue px-4 py-2 text-sm font-medium text-white"
            >
              PDF を開く
            </a>
            <a
              href={`/api/daily-reports/${id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-surface-border px-4 py-2 text-sm font-medium text-apple-text"
            >
              プレビュー
            </a>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
