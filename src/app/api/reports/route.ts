import { NextRequest, NextResponse } from "next/server";
import { listStoredReportDocuments } from "@/lib/db/repository";
import { isAccessGranted, withAnyPermission } from "@/lib/permissions/check";

export async function GET(request: NextRequest) {
  return withAnyPermission(
    request,
    [
      "site_survey_register",
      "site_survey_view_shared",
      "daily_report_register",
      "daily_report_view_all",
    ],
    async ({ session, accessMap }) => {
      try {
        const viewAll =
          isAccessGranted(accessMap.daily_report_view_all ?? "deny") ||
          session.role === "admin" ||
          session.role === "office" ||
          session.role === "manager";

        const reports = await listStoredReportDocuments(session.tenantId, {
          userId: session.id,
          viewAll,
        });
        return NextResponse.json({ reports });
      } catch (e) {
        const message = e instanceof Error ? e.message : "取得に失敗しました";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  );
}
