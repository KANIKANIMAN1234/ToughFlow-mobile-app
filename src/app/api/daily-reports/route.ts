import { NextRequest, NextResponse } from "next/server";
import {
  addDailyReport,
  createId,
  listDailyReports,
} from "@/lib/store/mock-store";
import type { DailyReport, DailyReportContent } from "@/lib/types";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
  return NextResponse.json({ reports: listDailyReports(userId) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    projectId,
    projectName,
    userId,
    userName,
    content,
    status = "submitted",
  } = body as {
    projectId: string;
    projectName: string;
    userId: string;
    userName: string;
    content: DailyReportContent;
    status?: DailyReport["status"];
  };

  const report: DailyReport = {
    id: createId("dr"),
    projectId,
    projectName,
    userId,
    userName,
    status,
    content,
    createdAt: new Date().toISOString(),
    submittedAt: status === "submitted" ? new Date().toISOString() : undefined,
  };

  addDailyReport(report);
  return NextResponse.json({ report }, { status: 201 });
}
