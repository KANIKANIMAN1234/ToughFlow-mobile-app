"use client";

import { AppShell } from "@/components/layout/AppShell";
import { IpadWizardLayout } from "@/components/layout/IpadWizardLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  SITE_SURVEY_STEPS,
  useSiteSurveyWizard,
} from "@/hooks/useSiteSurveyWizard";
import { cn } from "@/lib/utils";

export function SiteSurveyWizardIpad() {
  const {
    step,
    setStep,
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

  const footer = (
    <div className="flex gap-2">
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
            onClick={() => handleSubmit(true)}
          >
            確定
          </Button>
        </>
      )}
    </div>
  );

  return (
    <AppShell title="現地調査入力（iPad）">
      <IpadWizardLayout
        title="現地調査"
        steps={[...SITE_SURVEY_STEPS]}
        currentStep={step}
        onStepChange={setStep}
        footer={footer}
      >
        {step === 1 && (
          <div className="grid gap-4 lg:grid-cols-2">
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
              </div>
            </Card>
            <Card title="作業・機種">
              <div className="space-y-3">
                <Input
                  label="調査担当"
                  value={content.surveyorName}
                  onChange={(e) =>
                    setContent((c) => ({ ...c, surveyorName: e.target.value }))
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
                <div className="grid gap-2 sm:grid-cols-3">
                  {masters.workTypes.map((wt) => (
                    <label
                      key={wt.id}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                        content.workTypeId === wt.id &&
                          "border-brand-500 bg-brand-50"
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
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="搬入口">
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
            </Card>
            <Card title="車両・人数">
              <Textarea
                label="使用予定車両・重機"
                value={content.plannedVehicles.join("\n")}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    plannedVehicles: e.target.value.split("\n").filter(Boolean),
                  }))
                }
                placeholder="1行1件"
              />
              <div className="mt-3">
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
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="作業内容">
              <Textarea
                label="1行1項目"
                value={content.workSteps.join("\n")}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    workSteps: e.target.value.split("\n"),
                  }))
                }
              />
            </Card>
            <Card title="注意点">
              <Textarea
                label="1行1項目"
                value={content.precautions.join("\n")}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    precautions: e.target.value.split("\n"),
                  }))
                }
              />
            </Card>
          </div>
        )}

        {step === 4 && (
          <Card title="必要道具（積／使）">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {content.tools.map((tool, idx) => (
                <div
                  key={tool.toolId ?? idx}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
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
                  <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {step === 5 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="配置図（2枠）">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-2 py-8 text-center">
                  <span className="text-xs text-slate-600">搬入場所</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-2 py-8 text-center">
                  <span className="text-xs text-slate-600">工場内敷地</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                手書きキャンバスは今後追加（REQ-023）
              </p>
            </Card>
            <Card title="現場調査写真">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-12">
                <span className="text-sm text-slate-600">現場写真 1枚</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setContent((c) => ({
                      ...c,
                      photos: { ...c.photos, sitePhoto: url },
                    }));
                  }}
                />
              </label>
              {content.photos.sitePhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.photos.sitePhoto}
                  alt="現場"
                  className="mt-4 max-h-64 w-full rounded-xl object-contain"
                />
              )}
            </Card>
          </div>
        )}
      </IpadWizardLayout>
    </AppShell>
  );
}
