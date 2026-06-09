"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Textarea } from "@/components/ui/Textarea";
import { VoiceInputTextarea } from "@/components/ui/VoiceInputTextarea";
import { useSiteSurveyWizard } from "@/hooks/useSiteSurveyWizard";
import { WizardLoadState } from "@/components/ui/WizardLoadState";
import { SiteSurveyPhotoEntries } from "@/components/site-survey/SiteSurveyPhotoEntries";
import { cn } from "@/lib/utils";

const STEPS = ["基本", "搬入", "作業", "道具", "写真"];

export function SiteSurveyWizard() {
  const {
    step,
    setStep,
    projects,
    masters,
    mastersLoading,
    mastersError,
    projectId,
    selectProject,
    submitting,
    content,
    setContent,
    handleSubmit,
    goToPreview,
  } = useSiteSurveyWizard();

  if (!masters) {
    return (
      <WizardLoadState
        title="現地調査"
        loading={mastersLoading}
        error={mastersError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <AppShell title="現地調査入力">
      <StepIndicator steps={STEPS} current={step} />

      {step === 1 && (
        <Card title="基本情報">
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">案件</span>
              <select
                className="w-full rounded-xl border px-3 py-3"
                value={projectId}
                onChange={(e) => selectProject(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="お客様名"
              value={content.customerName}
              onChange={(e) =>
                setContent((c) => ({ ...c, customerName: e.target.value }))
              }
            />
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!content.hasEstimate}
                  onChange={() =>
                    setContent((c) => ({ ...c, hasEstimate: false }))
                  }
                />
                見積 無
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={content.hasEstimate}
                  onChange={() =>
                    setContent((c) => ({ ...c, hasEstimate: true }))
                  }
                />
                見積 有
              </label>
            </div>
            <Input
              label="下見日"
              type="date"
              value={content.surveyDate}
              onChange={(e) =>
                setContent((c) => ({ ...c, surveyDate: e.target.value }))
              }
            />
            <Input
              label="住所"
              value={content.siteAddress}
              onChange={(e) =>
                setContent((c) => ({ ...c, siteAddress: e.target.value }))
              }
            />
            <Input
              label="調査担当"
              value={content.surveyorName}
              onChange={(e) =>
                setContent((c) => ({ ...c, surveyorName: e.target.value }))
              }
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">作業内容</p>
              {masters.workTypes.map((wt) => (
                <label
                  key={wt.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                    content.workTypeId === wt.id && "border-brand-500 bg-brand-50"
                  )}
                >
                  <input
                    type="radio"
                    checked={content.workTypeId === wt.id}
                    onChange={() =>
                      setContent((c) => ({ ...c, workTypeId: wt.id }))
                    }
                  />
                  {wt.name}
                </label>
              ))}
            </div>
            <Input
              label="機種"
              value={content.machineModel}
              onChange={(e) =>
                setContent((c) => ({ ...c, machineModel: e.target.value }))
              }
            />
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="搬入状況">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="入口 H (mm)"
                type="number"
                value={content.entrance.heightMm ?? ""}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    entrance: {
                      ...c.entrance,
                      heightMm: Number(e.target.value) || undefined,
                    },
                  }))
                }
              />
              <Input
                label="入口 W (mm)"
                type="number"
                value={content.entrance.widthMm ?? ""}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    entrance: {
                      ...c.entrance,
                      widthMm: Number(e.target.value) || undefined,
                    },
                  }))
                }
              />
            </div>
            <Textarea
              label="使用予定車両・重機"
              value={content.plannedVehicles.join("\n")}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  plannedVehicles: e.target.value
                    .split("\n")
                    .filter(Boolean),
                }))
              }
              placeholder="1行1件"
            />
            <Input
              label="予定作業者数"
              type="number"
              value={content.plannedWorkers ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  plannedWorkers: Number(e.target.value) || undefined,
                }))
              }
            />
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="作業内容・注意点">
          <VoiceInputTextarea
            label="作業内容（1行1項目）"
            value={content.workSteps.join("\n")}
            onChange={(v) =>
              setContent((c) => ({
                ...c,
                workSteps: v.split("\n"),
              }))
            }
            formatContext="site_survey_work_steps"
          />
          <VoiceInputTextarea
            label="注意点"
            className="mt-3"
            value={content.precautions.join("\n")}
            onChange={(v) =>
              setContent((c) => ({
                ...c,
                precautions: v.split("\n"),
              }))
            }
            formatContext="site_survey_precautions"
          />
        </Card>
      )}

      {step === 4 && (
        <Card title="必要道具（積／使）">
          <div className="space-y-2">
            {content.tools.map((tool, idx) => (
              <div
                key={tool.toolId ?? idx}
                className="flex items-center gap-2 rounded-lg border px-2 py-2 text-sm"
              >
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={tool.load}
                    onChange={(e) => {
                      const tools = [...content.tools];
                      tools[idx] = { ...tool, load: e.target.checked };
                      setContent((c) => ({ ...c, tools }));
                    }}
                  />
                  積
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={tool.use}
                    onChange={(e) => {
                      const tools = [...content.tools];
                      tools[idx] = { ...tool, use: e.target.checked };
                      setContent((c) => ({ ...c, tools }));
                    }}
                  />
                  使
                </label>
                <span className="flex-1">{tool.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card title="現場調査写真">
          <SiteSurveyPhotoEntries
            content={content}
            setContent={setContent}
            variant="card"
          />
        </Card>
      )}

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-mobile gap-2 border-t bg-white p-4">
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            戻る
          </Button>
        )}
        {step < 5 ? (
          <Button fullWidth onClick={() => setStep((s) => s + 1)}>
            次へ
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
            >
              下書き
            </Button>
            <Button
              fullWidth
              disabled={submitting}
              onClick={goToPreview}
            >
              プレビューへ
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
