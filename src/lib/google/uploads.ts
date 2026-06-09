import {
  getFolderSettingsForDrive,
  updateDailyReportPdfRef,
  updateExpenseDriveFileId,
  updateSiteSurveyPdfRef,
} from "@/lib/db/repository";
import {
  resolveDocumentFolderName,
  type DriveDocumentType,
} from "@/lib/folder/document-folder-map";
import type { Expense } from "@/lib/types";
import { getDocumentSubfolderId, uploadFileToDrive } from "./drive";

async function requireDocumentSubfolderId(
  tenantId: string,
  projectId: string,
  documentType: DriveDocumentType,
  label: string
): Promise<string> {
  const settings = await getFolderSettingsForDrive(tenantId);
  const folderName = resolveDocumentFolderName(
    settings.documentFolderMap,
    documentType
  );
  const folderId = await getDocumentSubfolderId(
    tenantId,
    projectId,
    documentType
  );
  if (folderId) return folderId;

  throw new Error(
    `${label}の保存先フォルダ「${folderName}」を Google Drive 上に作成できませんでした。` +
      "設定のフォルダ設計（ルートフォルダ ID・共有ドライブ）を確認してください。"
  );
}

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
  const folderId = await requireDocumentSubfolderId(
    tenantId,
    expense.projectId,
    "expense",
    "立替・経費（領収書）"
  );

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
  const folderId = await requireDocumentSubfolderId(
    tenantId,
    projectId,
    "daily_report",
    "作業日報（PDF）"
  );

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
  const folderId = await requireDocumentSubfolderId(
    tenantId,
    projectId,
    "site_survey_report",
    "現地調査報告書（PDF）"
  );

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
