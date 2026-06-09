import { getSitePhotoEntries } from "@/lib/site-survey/photos";
import type { SiteSurveyContent } from "@/lib/types";
import { getDocumentSubfolderId, uploadFileToDrive } from "./drive";

function mimeToExt(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("heic")) return "heic";
  return "jpg";
}

function surveyPhotoFileName(
  surveyDate: string,
  field: string,
  mimeType: string
): string {
  const ymd = surveyDate.slice(0, 10).replace(/-/g, "");
  return `${ymd}_${field}.${mimeToExt(mimeType)}`;
}

function toDriveUrl(driveFileId: string): string {
  return `drive:${driveFileId}`;
}

function shouldReplaceUrl(url: string | undefined): boolean {
  return Boolean(url?.startsWith("blob:"));
}

export async function uploadSiteSurveyPhotos(
  tenantId: string,
  projectId: string,
  content: SiteSurveyContent,
  photoFiles: Map<string, { buffer: Buffer; mimeType: string }>
): Promise<{ content: SiteSurveyContent; driveFileIds: string[] }> {
  if (photoFiles.size === 0) {
    return { content, driveFileIds: [] };
  }

  const folderId = await getDocumentSubfolderId(
    tenantId,
    projectId,
    "site_survey_photo"
  );
  if (!folderId) {
    return { content, driveFileIds: [] };
  }
  const targetFolderId = folderId;

  const surveyDate = content.surveyDate || new Date().toISOString().slice(0, 10);
  const driveFileIds: string[] = [];
  const nextPhotos = { ...content.photos };

  async function uploadField(field: string, currentUrl: string | undefined) {
    const file = photoFiles.get(field);
    if (!file || !shouldReplaceUrl(currentUrl)) return currentUrl;

    const driveFileId = await uploadFileToDrive(
      targetFolderId,
      surveyPhotoFileName(surveyDate, field, file.mimeType),
      file.mimeType,
      file.buffer
    );
    if (!driveFileId) return currentUrl;

    driveFileIds.push(driveFileId);
    return toDriveUrl(driveFileId);
  }

  if (typeof nextPhotos.mapCarryIn === "string") {
    nextPhotos.mapCarryIn = await uploadField(
      "mapCarryIn",
      nextPhotos.mapCarryIn
    );
  }
  if (typeof nextPhotos.siteLayout === "string") {
    nextPhotos.siteLayout = await uploadField(
      "siteLayout",
      nextPhotos.siteLayout
    );
  }
  if (typeof nextPhotos.sitePhoto === "string") {
    nextPhotos.sitePhoto = await uploadField("sitePhoto", nextPhotos.sitePhoto);
  }

  const entries = getSitePhotoEntries(nextPhotos);
  const updatedEntries = [...entries];
  for (let i = 0; i < entries.length; i++) {
    const field = `sitePhotoEntries_${i}`;
    const nextUrl = await uploadField(field, entries[i]?.url);
    if (nextUrl && nextUrl !== entries[i]?.url) {
      updatedEntries[i] = { ...updatedEntries[i], url: nextUrl };
    }
  }

  const primary = updatedEntries.find((e) => e.url)?.url;
  return {
    content: {
      ...content,
      photos: {
        ...nextPhotos,
        sitePhotoEntries: updatedEntries,
        sitePhoto: primary ?? nextPhotos.sitePhoto,
      },
    },
    driveFileIds,
  };
}
