import { NextRequest, NextResponse } from "next/server";
import { createSiteSurvey, listSiteSurveys } from "@/lib/db/repository";
import { uploadSiteSurveyPhotos } from "@/lib/google/site-survey-photos";
import { requireAnyPermission, requirePermission } from "@/lib/permissions/check";
import type { SiteSurvey, SiteSurveyContent } from "@/lib/types";

type CreateBody = {
  projectId: string;
  content: SiteSurveyContent;
  status?: SiteSurvey["status"];
};

async function parsePhotoFiles(
  form: FormData
): Promise<Map<string, { buffer: Buffer; mimeType: string }>> {
  const map = new Map<string, { buffer: Buffer; mimeType: string }>();
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("photo_") || !(value instanceof File) || value.size === 0) {
      continue;
    }
    const field = key.slice("photo_".length);
    map.set(field, {
      buffer: Buffer.from(await value.arrayBuffer()),
      mimeType: value.type || "image/jpeg",
    });
  }
  return map;
}

async function parseCreateRequest(request: NextRequest): Promise<{
  body: CreateBody;
  photoFiles: Map<string, { buffer: Buffer; mimeType: string }>;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const payload = form.get("payload");
    if (typeof payload !== "string") {
      throw new Error("payload が不正です");
    }
    const body = JSON.parse(payload) as CreateBody;
    const photoFiles = await parsePhotoFiles(form);
    return { body, photoFiles };
  }

  const body = (await request.json()) as CreateBody;
  return { body, photoFiles: new Map() };
}

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
    const { body, photoFiles } = await parseCreateRequest(request);
    const status = body.status ?? "draft";

    const { content, driveFileIds } = await uploadSiteSurveyPhotos(
      auth.session.tenantId,
      body.projectId,
      body.content,
      photoFiles
    );

    const survey = await createSiteSurvey(auth.session.tenantId, {
      projectId: body.projectId,
      userId: auth.session.id,
      content,
      status,
      driveFileIds,
    });

    return NextResponse.json({ survey, driveFileIds }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
