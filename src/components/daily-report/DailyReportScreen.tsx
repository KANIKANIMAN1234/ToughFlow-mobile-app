"use client";

import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { DailyReportWizard } from "@/components/daily-report/DailyReportWizard";
import { DailyReportWizardIpad } from "@/components/daily-report/DailyReportWizardIpad";

export function DailyReportScreen() {
  const { isTablet } = useDisplayMode();
  return isTablet ? <DailyReportWizardIpad /> : <DailyReportWizard />;
}
