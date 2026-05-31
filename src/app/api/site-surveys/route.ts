import { NextRequest, NextResponse } from "next/server";
import {
  addSiteSurvey,
  createId,
  listSiteSurveys,
} from "@/lib/store/mock-store";
import type { SiteSurvey, SiteSurveyContent } from "@/lib/types";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
  return NextResponse.json({ surveys: listSiteSurveys(userId) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    projectId,
    projectName,
    userId,
    userName,
    content,
    status = "draft",
  } = body as {
    projectId: string;
    projectName: string;
    userId: string;
    userName: string;
    content: SiteSurveyContent;
    status?: SiteSurvey["status"];
  };

  const survey: SiteSurvey = {
    id: createId("ss"),
    projectId,
    projectName,
    userId,
    userName,
    status,
    content,
    createdAt: new Date().toISOString(),
    publishedAt: status === "published" ? new Date().toISOString() : undefined,
  };

  addSiteSurvey(survey);
  return NextResponse.json({ survey }, { status: 201 });
}
