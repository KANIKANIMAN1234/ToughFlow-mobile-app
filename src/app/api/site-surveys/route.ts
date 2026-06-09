import { NextRequest, NextResponse } from "next/server";
import { formatDbError } from "@/lib/db/errors";
import { createSiteSurvey, listSiteSurveys } from "@/lib/db/repository";
import { uploadSiteSurveyPhotos } from "@/lib/google/site-survey-photos";
import { generateAndStoreSiteSurveyPdf } from "@/lib/pdf/submit-site-survey-pdf";
import { withAnyPermission, withPermission } from "@/lib/permissions/check";
import { sanitizeSiteSurveyContent } from "@/lib/site-survey/sanitize-content";
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
  return withAnyPermission(
    request,
    ["site_survey_register", "site_survey_view_shared"],
    async ({ session }) => {
      const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
      try {
        const surveys = await listSiteSurveys(session.tenantId, userId);
        return NextResponse.json({ surveys });
      } catch (e) {
        const message =
          e instanceof Error
            ? formatDbError(e.message)
            : "取得に失敗しました";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  );
}

export async function POST(request: NextRequest) {
  return withPermission(request, "site_survey_register", async ({ session }) => {
    try {
      const { body, photoFiles } = await parseCreateRequest(request);
      const status = body.status ?? "draft";

      if (!body.projectId?.trim()) {
        return NextResponse.json({ error: "案件が選択されていません" }, { status: 400 });
      }

      const sanitized = sanitizeSiteSurveyContent(body.content);

      const { content, driveFileIds } = await uploadSiteSurveyPhotos(
        session.tenantId,
        body.projectId,
        sanitized,
        photoFiles
      );

      const survey = await createSiteSurvey(session.tenantId, {
        projectId: body.projectId,
        userId: session.id,
        content,
        status,
        driveFileIds,
      });

      let pdfGenerated = false;
      let pdfWarning: string | undefined;
      if (status === "published") {
        try {
          const pdfResult = await generateAndStoreSiteSurveyPdf(
            session.tenantId,
            survey
          );
          pdfGenerated = pdfResult.pdfGenerated;
        } catch (e) {
          pdfWarning =
            e instanceof Error ? e.message : "PDF 生成に失敗しました";
          console.error("[site-surveys] pdf generation failed:", e);
        }
      }

      return NextResponse.json(
        { survey, driveFileIds, pdfGenerated, pdfWarning },
        { status: 201 }
      );
    } catch (e) {
      const message =
        e instanceof Error
          ? formatDbError(e.message)
          : "登録に失敗しました";
      console.error("[site-surveys] create failed:", e);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
