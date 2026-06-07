import { NextRequest, NextResponse } from "next/server";
import { buildDailyReportPdfContext } from "@/lib/pdf/daily-report-context";
import { renderDailyReportHtml } from "@/lib/pdf/daily-report-html";
import { requirePermission } from "@/lib/permissions/check";
import type { DailyReport, DailyReportContent } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "daily_report_register");
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { projectId, projectName, content } = body as {
      projectId: string;
      projectName?: string;
      content: DailyReportContent;
    };

    if (!projectId || !content) {
      return NextResponse.json({ error: "projectId and content required" }, { status: 400 });
    }

    const draft: DailyReport = {
      id: "preview",
      projectId,
      projectName: projectName ?? "",
      userId: auth.session.id,
      userName: auth.session.name,
      status: "draft",
      content,
      createdAt: new Date().toISOString(),
    };

    const ctx = await buildDailyReportPdfContext(auth.session.tenantId, draft);
    const html = renderDailyReportHtml(ctx);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "プレビュー生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
