import { NextRequest, NextResponse } from "next/server";
import {
  createDailyReport,
  getDailyReport,
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
