import { NextRequest, NextResponse } from "next/server";
import { createSiteSurvey, listSiteSurveys } from "@/lib/db/repository";
import {
  getSessionFromRequest,
  unauthorizedResponse,
} from "@/lib/auth/session";
import type { SiteSurvey, SiteSurveyContent } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
  try {
    const surveys = await listSiteSurveys(session.tenantId, userId);
    return NextResponse.json({ surveys });
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
    const { projectId, content, status = "draft" } = body as {
      projectId: string;
      content: SiteSurveyContent;
      status?: SiteSurvey["status"];
    };

    const survey = await createSiteSurvey(session.tenantId, {
      projectId,
      userId: session.id,
      content,
      status,
    });
    return NextResponse.json({ survey }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
