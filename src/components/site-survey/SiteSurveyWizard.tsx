"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import type {
  Project,
  SiteSurveyContent,
  SiteSurveyMasters,
  SiteSurveyToolCheck,
} from "@/lib/types";
import { cn, todayISO } from "@/lib/utils";

const STEPS = ["基本", "搬入", "作業", "道具", "写真"];

export function SiteSurveyWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [masters, setMasters] = useState<SiteSurveyMasters | null>(null);
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState<SiteSurveyContent>(() => ({
    customerName: "",
    hasEstimate: true,
    surveyDate: todayISO(),
    siteAddress: "",
    surveyorName: "",
    workDatetime: todayISO(),
    workTypeId: "",
    machineModel: "",
    entrance: {},
    plannedVehicles: [],
    unload: {},
    facility: {},
    workSteps: [""],
    precautions: [""],
    tools: [],
    photos: {},
  }));

  useEffect(() => {
    Promise.all([
      api.get<{ projects: Project[] }>("/api/projects"),
      api.get<SiteSurveyMasters>("/api/masters/site-survey"),
    ]).then(([p, m]) => {
      setProjects(p.projects);
      setMasters(m);
      const tools: SiteSurveyToolCheck[] = m.tools.map((t) => ({
        toolId: t.id,
        name: t.name,
        load: false,
        use: false,
      }));
      if (p.projects[0]) {
        setProjectId(p.projects[0].id);
        setContent((c) => ({
          ...c,
          customerName: p.projects[0].customerName,
          siteAddress: p.projects[0].siteAddress,
          surveyorName: user?.name ?? "",
          workTypeId: m.workTypes[0]?.id ?? "",
          tools,
        }));
      } else {
        setContent((c) => ({ ...c, tools }));
      }
    });
  }, [user?.name]);

  const selectedProject = projects.find((p) => p.id === projectId);

  async function handleSubmit(publish: boolean) {
    if (!user || !selectedProject) return;
    setSubmitting(true);
    try {
      await api.post("/api/site-surveys", {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        userId: user.id,
        userName: user.name,
        content,
        status: publish ? "published" : "draft",
      });
      router.push("/site-surveys");
    } finally {
      setSubmitting(false);
    }
  }

  if (!masters) {
    return (
      <AppShell title="現地調査">
        <p className="text-center text-slate-500">読み込み中…</p>
      </AppShell>
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
                onChange={(e) => {
                  const id = e.target.value;
                  setProjectId(id);
                  const proj = projects.find((p) => p.id === id);
                  if (!proj) return;
                  setContent((c) => ({
                    ...c,
                    customerName: proj.customerName,
                    siteAddress: proj.siteAddress,
                  }));
                }}
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
          <Textarea
            label="作業内容（1行1項目）"
            value={content.workSteps.join("\n")}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                workSteps: e.target.value.split("\n"),
              }))
            }
          />
          <Textarea
            label="注意点"
            className="mt-3"
            value={content.precautions.join("\n")}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                precautions: e.target.value.split("\n"),
              }))
            }
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
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8">
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
              className="mt-3 max-h-48 w-full rounded-xl object-cover"
            />
          )}
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
              onClick={() => handleSubmit(true)}
            >
              確定
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
