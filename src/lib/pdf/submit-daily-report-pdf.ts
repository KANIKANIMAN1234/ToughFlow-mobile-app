import { updateDailyReportPdfRef } from "@/lib/db/repository";
import { isDriveConfigured } from "@/lib/google/client";
import { uploadDailyReportPdf as uploadDailyReportPdfToDrive } from "@/lib/google/uploads";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DailyReport } from "@/lib/types";
import { buildDailyReportPdfContext, buildPdfFilename } from "./daily-report-context";
import { renderDailyReportPdf } from "./render-daily-report-pdf";

const PDF_BUCKET = "report-pdfs";

async function uploadDailyReportPdf(
  tenantId: string,
  reportId: string,
  pdf: Buffer
): Promise<string | null> {
  const supabase = createAdminClient();
  const path = `${tenantId}/daily-reports/${reportId}.pdf`;
  const { error } = await supabase.storage.from(PDF_BUCKET).upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) return null;
  return path;
}

export async function generateAndStoreDailyReportPdf(
  tenantId: string,
  report: DailyReport
): Promise<{ pdfGenerated: boolean; driveFileId?: string; storagePath?: string }> {
  const ctx = await buildDailyReportPdfContext(tenantId, report);
  const pdf = await renderDailyReportPdf(ctx);
  const filename = buildPdfFilename(report);

  if (isDriveConfigured()) {
    const driveFileId = await uploadDailyReportPdfToDrive(
      tenantId,
      report.projectId,
      report.id,
      filename,
      pdf
    );
    if (driveFileId) {
      return { pdfGenerated: true, driveFileId };
    }
  }

  const storagePath = await uploadDailyReportPdf(tenantId, report.id, pdf);
  if (storagePath) {
    await updateDailyReportPdfRef(tenantId, report.id, `storage:${storagePath}`);
    return { pdfGenerated: true, storagePath };
  }

  return { pdfGenerated: true };
}
