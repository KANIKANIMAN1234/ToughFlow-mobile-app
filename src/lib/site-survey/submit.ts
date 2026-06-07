import { api } from "@/lib/api/client";
import type { SiteSurvey, SiteSurveyContent } from "@/lib/types";
import { collectSiteSurveyPhotoFiles } from "./collect-photo-files";

type SubmitPayload = {
  projectId: string;
  content: SiteSurveyContent;
  status: SiteSurvey["status"];
};

export async function submitSiteSurvey(
  payload: SubmitPayload
): Promise<{ survey: SiteSurvey }> {
  const photoFiles = await collectSiteSurveyPhotoFiles(payload.content);

  if (photoFiles.length > 0) {
    const form = new FormData();
    form.append("payload", JSON.stringify(payload));
    for (const { field, file } of photoFiles) {
      form.append(`photo_${field}`, file);
    }
    const res = await fetch("/api/site-surveys", {
      method: "POST",
      body: form,
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "登録に失敗しました");
    }
    return data as { survey: SiteSurvey };
  }

  return api.post<{ survey: SiteSurvey }>("/api/site-surveys", payload);
}
