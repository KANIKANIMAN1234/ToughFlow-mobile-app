import { NextRequest, NextResponse } from "next/server";
import { getSiteSurvey } from "@/lib/db/repository";
import { isDriveConfigured } from "@/lib/google/client";
import { generateAndStoreSiteSurveyPdf } from "@/lib/pdf/submit-site-survey-pdf";
import { withAnyPermission } from "@/lib/permissions/check";

type RouteParams = { params: Promise<{ id: string }> };

/** 確定済み現地調査の PDF を設定に従ったフォルダへ再アップロード */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAnyPermission(
    request,
    ["site_survey_register"],
    async ({ session }) => {
      const { id } = await params;
      try {
        if (!isDriveConfigured()) {
          return NextResponse.json(
            { error: "Google Drive が未設定です（GOOGLE_SERVICE_ACCOUNT_JSON）" },
            { status: 503 }
          );
        }

        const survey = await getSiteSurvey(session.tenantId, id);
        if (!survey) {
          return NextResponse.json({ error: "not found" }, { status: 404 });
        }
        if (survey.status !== "published") {
          return NextResponse.json(
            { error: "確定済みの現地調査のみ PDF を Drive に保存できます" },
            { status: 400 }
          );
        }

        const result = await generateAndStoreSiteSurveyPdf(
          session.tenantId,
          survey
        );
        return NextResponse.json({
          pdfGenerated: result.pdfGenerated,
          driveFileId: result.driveFileId,
        });
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "PDF の Drive 保存に失敗しました";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  );
}
