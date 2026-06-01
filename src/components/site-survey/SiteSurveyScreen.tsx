"use client";

import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { SiteSurveyWizard } from "@/components/site-survey/SiteSurveyWizard";
import { SiteSurveyWizardIpad } from "@/components/site-survey/SiteSurveyWizardIpad";

export function SiteSurveyScreen() {
  const { isTablet } = useDisplayMode();
  return isTablet ? <SiteSurveyWizardIpad /> : <SiteSurveyWizard />;
}
