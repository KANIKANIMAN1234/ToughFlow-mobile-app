"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function ReportPdfViewPage() {
  const params = useParams<{ driveFileId: string }>();
  const searchParams = useSearchParams();
  const { user, authLoading } = useAuthGuard();

  const driveFileId = decodeURIComponent(params.driveFileId ?? "");
  const title = searchParams.get("title") ?? "報告書 PDF";
  const pdfUrl = `/api/drive/files/${encodeURIComponent(driveFileId)}`;

  if (authLoading || !user) {
    return (
      <AppShell title="PDF 表示">
        <p className="text-caption text-apple-glyph">読み込み中…</p>
      </AppShell>
    );
  }

  if (!driveFileId) {
    return (
      <AppShell title="PDF 表示">
        <p className="text-caption text-red-600">ファイル ID が不正です。</p>
        <Link href="/reports" className="mt-4 inline-block text-brand-600">
          一覧に戻る
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={title}>
      <div className="mb-3 flex gap-2">
        <Link
          href="/reports"
          className="inline-flex items-center justify-center rounded-pill border border-brand-600 px-4 py-2 text-sm text-brand-600"
        >
          ← 一覧
        </Link>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-pill bg-brand-600 px-4 py-2 text-sm text-white"
        >
          別タブで開く
        </a>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-card border border-surface-border bg-white">
        <iframe
          title={title}
          src={pdfUrl}
          className="h-[calc(100dvh-11rem)] w-full"
        />
      </div>
    </AppShell>
  );
}
