import { NextRequest, NextResponse } from "next/server";
import { getDailyReportMasters } from "@/lib/db/repository";
import { withDbSession } from "@/lib/permissions/check";

export async function GET(request: NextRequest) {
  return withDbSession(request, async (session) => {
    try {
      const masters = await getDailyReportMasters(session.tenantId);
      return NextResponse.json(masters);
    } catch (e) {
      const message = e instanceof Error ? e.message : "取得に失敗しました";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
