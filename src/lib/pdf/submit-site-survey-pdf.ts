import { isDriveConfigured } from "@/lib/google/client";
import { uploadSiteSurveyReportPdf } from "@/lib/google/uploads";
import type { SiteSurvey } from "@/lib/types";
import {
  buildSiteSurveyPdfContext,
  buildSiteSurveyPdfFilename,
} from "./site-survey-context";
import { renderSiteSurveyPdf } from "./render-site-survey-pdf";

export async function generateAndStoreSiteSurveyPdf(
  tenantId: string,
  survey: SiteSurvey
): Promise<{ pdfGenerated: boolean; driveFileId?: string }> {
  const ctx = await buildSiteSurveyPdfContext(tenantId, survey);
  const pdf = await renderSiteSurveyPdf(ctx);
  const filename = buildSiteSurveyPdfFilename(survey);

  if (isDriveConfigured()) {
    const driveFileId = await uploadSiteSurveyReportPdf(
      tenantId,
      survey.projectId,
      survey.id,
      filename,
      pdf
    );
    if (!driveFileId) {
      throw new Error(
        "現地調査報告書（PDF）の Google Drive へのアップロードに失敗しました。"
      );
    }
    return { pdfGenerated: true, driveFileId };
  }

  return { pdfGenerated: true };
}
