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
    openPreview,
    handleSubmit,
  } = useDailyReportWizard();

  if (!masters) {
    return (
      <AppShell title="作業日報">
        <p className="p-6 text-center text-apple-glyph">読み込み中…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="作業日報">
      <div className="flex h-full min-h-0 flex-1 flex-col bg-apple-section">
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
            <Button
              variant="secondary"
              onClick={() => openPreview().catch((e) => alert(e.message))}
            >
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
