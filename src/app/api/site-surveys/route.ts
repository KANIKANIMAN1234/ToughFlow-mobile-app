import { NextRequest, NextResponse } from "next/server";
import { createSiteSurvey, listSiteSurveys } from "@/lib/db/repository";
import { requireAnyPermission, requirePermission } from "@/lib/permissions/check";
import type { SiteSurvey, SiteSurveyContent } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireAnyPermission(request, [
    "site_survey_register",
    "site_survey_view_shared",
  ]);
  if (auth instanceof Response) return auth;

  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
  try {
    const surveys = await listSiteSurveys(auth.session.tenantId, userId);
    return NextResponse.json({ surveys });
  } catch (e) {
    const message = e instanceof Error ? e.message : "取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "site_survey_register");
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { projectId, content, status = "draft" } = body as {
      projectId: string;
      content: SiteSurveyContent;
      status?: SiteSurvey["status"];
    };

    const survey = await createSiteSurvey(auth.session.tenantId, {
      projectId,
      userId: auth.session.id,
      content,
      status,
    });
    return NextResponse.json({ survey }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
