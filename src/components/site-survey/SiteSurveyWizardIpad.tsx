"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SiteSurveyScrollForm } from "@/components/site-survey/ipad/SiteSurveyScrollForm";
import { useSiteSurveyWizard } from "@/hooks/useSiteSurveyWizard";

export function SiteSurveyWizardIpad() {
  const {
    projects,
    masters,
    projectId,
    selectProject,
    submitting,
    content,
    setContent,
    handleSubmit,
  } = useSiteSurveyWizard();

  if (!masters) {
    return (
      <AppShell title="現地調査">
        <p className="p-6 text-center text-slate-500">読み込み中…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="現地調査報告書">
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col bg-slate-200">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <SiteSurveyScrollForm
            projects={projects}
            projectId={projectId}
            selectProject={selectProject}
            masters={masters}
            content={content}
            setContent={setContent}
          />
        </div>

        <div className="shrink-0 border-t border-surface-border bg-white px-6 py-4">
          <div className="mx-auto flex max-w-[794px] gap-2">
            <Button variant="secondary" disabled>
              プレビュー
            </Button>
            <Button
              variant="secondary"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
            >
              下書き保存
            </Button>
            <Button
              fullWidth
              disabled={submitting}
              onClick={() => handleSubmit(true)}
            >
              {submitting ? "保存中…" : "確定"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
