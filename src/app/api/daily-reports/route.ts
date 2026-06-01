import { NextRequest, NextResponse } from "next/server";
import {
  createDailyReport,
  listDailyReports,
} from "@/lib/db/repository";
import {
  getSessionFromRequest,
  unauthorizedResponse,
} from "@/lib/auth/session";
import type { DailyReport, DailyReportContent } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
  try {
    const reports = await listDailyReports(session.tenantId, userId);
    return NextResponse.json({ reports });
  } catch (e) {
    const message = e instanceof Error ? e.message : "取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

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
    return NextResponse.json({ report }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
