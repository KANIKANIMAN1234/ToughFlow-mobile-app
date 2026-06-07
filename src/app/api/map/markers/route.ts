import { NextRequest, NextResponse } from "next/server";

import {
  forbiddenResponse,
  getSessionFromRequest,
  unauthorizedResponse,
} from "@/lib/auth/session";
import { getUserAccessMap, listMapMarkers } from "@/lib/db/repository";
import { isAccessGranted } from "@/lib/permissions/access";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const accessMap = await getUserAccessMap(
      session.tenantId,
      session.id,
      session.role
    );
    const allowed =
      isAccessGranted(accessMap.project_list_other ?? "deny") ||
      isAccessGranted(accessMap.daily_report_register ?? "deny") ||
      isAccessGranted(accessMap.site_survey_register ?? "deny");
    if (!allowed) return forbiddenResponse();

    const markers = await listMapMarkers(session.tenantId);
    return NextResponse.json({ markers });
  } catch (e) {
    const message = e instanceof Error ? e.message : "取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
