"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { StoredReportDocument } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function ReportCard({ report }: { report: StoredReportDocument }) {
  return (
    <Link href={`/reports/view/${encodeURIComponent(report.driveFileId)}?title=${encodeURIComponent(report.typeLabel + " - " + report.title)}`}>
      <Card className="transition-colors active:bg-apple-section">
        <div className="flex items-start justify-between gap-2">
          <p className="font-normal text-apple-text">{report.title}</p>
          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600">
            {report.typeLabel}
          </span>
        </div>
        <p className="mt-1 text-nav-link text-apple-glyph">
          {formatDate(report.documentDate)} · {report.projectName}
        </p>
        <p className="mt-1 text-xs text-apple-glyph">{report.userName}</p>
      </Card>
    </Link>
  );
}

export default function ReportsPage() {
  const { user, authLoading } = useAuthGuard();
  const { data, isLoading, error } = useApi<{ reports: StoredReportDocument[] }>(
    user ? "/api/reports" : null
  );

  const reports = data?.reports ?? [];

  if (authLoading || !user) {
    return (
      <AppShell title="各種報告書">
        <CardListSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="各種報告書">
      <p className="mb-4 text-caption text-apple-glyph">
        Google Drive に保存された報告書 PDF の一覧です。タップすると表示します。
      </p>

      {error && (
        <Card>
          <p className="text-caption text-red-600">{error.message}</p>
        </Card>
      )}

      {isLoading && !data ? (
        <CardListSkeleton />
      ) : reports.length === 0 ? (
        <Card>
          <p className="text-caption text-apple-glyph">
            保存済みの報告書 PDF がありません。現地調査の確定や作業日報の提出後に表示されます。
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard key={`${report.type}-${report.id}`} report={report} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
