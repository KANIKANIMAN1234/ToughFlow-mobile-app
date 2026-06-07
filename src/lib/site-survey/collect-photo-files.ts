import { getSitePhotoEntries } from "@/lib/site-survey/photos";
import type { SiteSurveyContent } from "@/lib/types";

export type SiteSurveyPhotoFile = {
  field: string;
  file: File;
};

async function blobUrlToFile(url: string, field: string): Promise<File | null> {
  if (!url.startsWith("blob:")) return null;
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = blob.type.includes("png")
    ? "png"
    : blob.type.includes("webp")
      ? "webp"
      : "jpg";
  return new File([blob], `${field}.${ext}`, {
    type: blob.type || "image/jpeg",
  });
}

export async function collectSiteSurveyPhotoFiles(
  content: SiteSurveyContent
): Promise<SiteSurveyPhotoFile[]> {
  const results: SiteSurveyPhotoFile[] = [];

  const entries = getSitePhotoEntries(content.photos);
  const entryBlobUrls = new Set(
    entries.map((e) => e.url).filter((u) => u.startsWith("blob:"))
  );

  const singles: Array<keyof SiteSurveyContent["photos"]> = [
    "mapCarryIn",
    "siteLayout",
    "sitePhoto",
  ];

  for (const key of singles) {
    if (key === "sitePhoto" && entryBlobUrls.size > 0) continue;
    const url = content.photos[key];
    if (typeof url !== "string") continue;
    const file = await blobUrlToFile(url, String(key));
    if (file) results.push({ field: String(key), file });
  }

  for (let i = 0; i < entries.length; i++) {
    const url = entries[i]?.url;
    if (!url) continue;
    const file = await blobUrlToFile(url, `sitePhotoEntries_${i}`);
    if (file) results.push({ field: `sitePhotoEntries_${i}`, file });
  }

  return results;
}
