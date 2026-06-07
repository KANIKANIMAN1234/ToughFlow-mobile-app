import { NextRequest, NextResponse } from "next/server";
import {
  createDailyReport,
  getDailyReport,
  listDailyReports,
} from "@/lib/db/repository";
import { generateAndStoreDailyReportPdf } from "@/lib/pdf/submit-daily-report-pdf";
import { requirePermission } from "@/lib/permissions/check";
import type { DailyReport, DailyReportContent } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "daily_report_register");
  if (auth instanceof Response) return auth;
  const session = auth.session;

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const userId = searchParams.get("userId") ?? undefined;

  try {
    if (id) {
      const report = await getDailyReport(session.tenantId, id);
      if (!report) {
        return NextResponse.json({ error: "見つかりません" }, { status: 404 });
      }
      return NextResponse.json({ report });
    }

    const reports = await listDailyReports(session.tenantId, userId);
    return NextResponse.json({ reports });
  } catch (e) {
    const message = e instanceof Error ? e.message : "取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "daily_report_register");
  if (auth instanceof Response) return auth;
  const session = auth.session;

  try {
    const body = await request.json();
    const { projectId, content, status = "submitted" } = body as {
      projectId: string;
      content: DailyReportContent;
      status?: DailyReport["status"];
    };

    const report = await createDailyReport(session.tenantId, {
      projectId,
      userId: session.id,
      content,
      status,
    });

    let pdfGenerated = false;
    if (status === "submitted") {
      const pdfResult = await generateAndStoreDailyReportPdf(
        session.tenantId,
        report
      );
      pdfGenerated = pdfResult.pdfGenerated;
    }

    return NextResponse.json({ report, pdfGenerated }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
