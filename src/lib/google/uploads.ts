import {
  updateDailyReportPdfRef,
  updateExpenseDriveFileId,
  updateSiteSurveyPdfRef,
} from "@/lib/db/repository";
import type { Expense } from "@/lib/types";
import { getSubfolderId, uploadFileToDrive } from "./drive";

function receiptFileName(
  expense: Pick<Expense, "expenseDate" | "amount" | "categoryName">,
  ext: string
): string {
  const ymd = expense.expenseDate.replace(/-/g, "");
  const category = expense.categoryName ?? "経費";
  return `${ymd}_${expense.amount}_${category}.${ext}`;
}

function mimeToExt(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("heic")) return "heic";
  return "jpg";
}

export async function uploadExpenseReceipt(
  tenantId: string,
  expense: Expense,
  file: { buffer: Buffer; mimeType: string }
): Promise<string | null> {
  const folderId = await getSubfolderId(tenantId, expense.projectId, "経費");
  if (!folderId) return null;

  const ext = mimeToExt(file.mimeType);
  const fileName = receiptFileName(expense, ext);
  const driveFileId = await uploadFileToDrive(
    folderId,
    fileName,
    file.mimeType,
    file.buffer
  );

  if (driveFileId) {
    await updateExpenseDriveFileId(tenantId, expense.id, driveFileId);
  }

  return driveFileId;
}

export async function uploadDailyReportPdf(
  tenantId: string,
  projectId: string,
  reportId: string,
  fileName: string,
  pdf: Buffer
): Promise<string | null> {
  const folderId = await getSubfolderId(tenantId, projectId, "日報");
  if (!folderId) return null;

  const driveFileId = await uploadFileToDrive(
    folderId,
    fileName,
    "application/pdf",
    pdf
  );

  if (driveFileId) {
    await updateDailyReportPdfRef(tenantId, reportId, driveFileId);
  }

  return driveFileId;
}

export async function uploadSiteSurveyReportPdf(
  tenantId: string,
  projectId: string,
  surveyId: string,
  fileName: string,
  pdf: Buffer
): Promise<string | null> {
  const folderId = await getSubfolderId(tenantId, projectId, "報告書");
  if (!folderId) return null;

  const driveFileId = await uploadFileToDrive(
    folderId,
    fileName,
    "application/pdf",
    pdf
  );

  if (driveFileId) {
    await updateSiteSurveyPdfRef(tenantId, surveyId, driveFileId);
  }

  return driveFileId;
}
