import type { SiteSurveyContent } from "@/lib/types";

/** blob: URL は DB 保存不可のため除去（Drive 未連携時のフォールバック） */
export function sanitizeSiteSurveyContent(
  content: SiteSurveyContent
): SiteSurveyContent {
  const photos = { ...content.photos };

  for (const key of ["mapCarryIn", "siteLayout", "sitePhoto"] as const) {
    const url = photos[key];
    if (typeof url === "string" && url.startsWith("blob:")) {
      delete photos[key];
    }
  }

  if (photos.sitePhotoEntries) {
    photos.sitePhotoEntries = photos.sitePhotoEntries.map((entry) => ({
      ...entry,
      url:
        typeof entry.url === "string" && entry.url.startsWith("blob:")
          ? ""
          : entry.url,
    }));
  }

  return { ...content, photos };
}
