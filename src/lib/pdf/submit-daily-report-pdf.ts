import { updateDailyReportPdfRef } from "@/lib/db/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DailyReport } from "@/lib/types";
import { buildDailyReportPdfContext } from "./daily-report-context";
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
): Promise<{ pdfGenerated: boolean; storagePath?: string }> {
  const ctx = await buildDailyReportPdfContext(tenantId, report);
  const pdf = await renderDailyReportPdf(ctx);
  const storagePath = await uploadDailyReportPdf(tenantId, report.id, pdf);

  if (storagePath) {
    await updateDailyReportPdfRef(tenantId, report.id, `storage:${storagePath}`);
    return { pdfGenerated: true, storagePath };
  }

  return { pdfGenerated: true };
}
