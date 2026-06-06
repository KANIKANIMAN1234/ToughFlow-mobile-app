import type { SiteSurveyContent } from "@/lib/types";

const KEY = "site-survey-preview";

export type SiteSurveyPreviewState = {
  projectId: string;
  projectName: string;
  content: SiteSurveyContent;
};

export function savePreviewState(state: SiteSurveyPreviewState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function loadPreviewState(): SiteSurveyPreviewState | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SiteSurveyPreviewState;
  } catch {
    return null;
  }
}

export function clearPreviewState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
