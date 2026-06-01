"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { DailyReportScrollForm } from "@/components/daily-report/ipad/DailyReportScrollForm";
import { useDailyReportWizard } from "@/hooks/useDailyReportWizard";

export function DailyReportWizardIpad() {
  const {
    projects,
    masters,
    projectId,
    selectProject,
    submitting,
    content,
    setContent,
    vehicleMap,
    toggleVehicle,
    setVehicleNote,
    setMaterialValue,
    getMaterialValue,
    handleSubmit,
  } = useDailyReportWizard();

  if (!masters) {
    return (
      <AppShell title="作業日報">
        <p className="p-6 text-center text-slate-500">読み込み中…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="作業日報">
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col bg-slate-200">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <DailyReportScrollForm
            projects={projects}
            projectId={projectId}
            selectProject={selectProject}
            masters={masters}
            content={content}
            setContent={setContent}
            vehicleMap={vehicleMap}
            toggleVehicle={toggleVehicle}
            setVehicleNote={setVehicleNote}
            setMaterialValue={setMaterialValue}
            getMaterialValue={getMaterialValue}
          />
        </div>

        <div className="shrink-0 border-t border-surface-border bg-white px-6 py-4">
          <div className="mx-auto flex max-w-[794px] gap-2">
            <Button variant="secondary" disabled>
              PDFプレビュー
            </Button>
            <Button fullWidth disabled={submitting} onClick={handleSubmit}>
              {submitting ? "送信中…" : "送信"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
