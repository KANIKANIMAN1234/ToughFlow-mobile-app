"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Textarea } from "@/components/ui/Textarea";
import { useDailyReportWizard } from "@/hooks/useDailyReportWizard";
import { circleNumber, cn } from "@/lib/utils";

const STEPS = ["基本", "作業", "車両", "資材", "備考", "時間"];

export function DailyReportWizard() {
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
    vehicleMap,
    toggleVehicle,
    setVehicleNote,
    setMaterialValue,
    getMaterialValue,
    addMachineRow,
    handleSubmit,
  } = useDailyReportWizard();

  if (!masters) {
    return (
      <AppShell title="作業日報">
        <p className="text-center text-slate-500">読み込み中…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="作業日報入力">
      <StepIndicator steps={STEPS} current={step} />

      {step === 1 && (
        <Card title="【 作 業 日 報 】 基本情報">
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">案件</span>
              <select
                className="w-full rounded-xl border border-surface-border px-3 py-3"
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
              label="請求先名"
              value={content.billingClient}
              onChange={(e) =>
                setContent((c) => ({ ...c, billingClient: e.target.value }))
              }
            />
            <Input
              label="担当者（客先）"
              value={content.clientContact ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, clientContact: e.target.value }))
              }
            />
            <Input
              label="作業日"
              type="date"
              value={content.workDateStart}
              onChange={(e) =>
                setContent((c) => ({ ...c, workDateStart: e.target.value }))
              }
            />
            <Input
              label="引取先 住所"
              value={content.pickup.address ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  pickup: { ...c.pickup, address: e.target.value },
                }))
              }
            />
            <Input
              label="引取先 会社名"
              value={content.pickup.company ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  pickup: { ...c.pickup, company: e.target.value },
                }))
              }
            />
            <Input
              label="納入先 住所"
              value={content.delivery.address}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  delivery: { ...c.delivery, address: e.target.value },
                }))
              }
            />
            <Input
              label="納入先 会社名"
              value={content.delivery.company}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  delivery: { ...c.delivery, company: e.target.value },
                }))
              }
            />
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="作業内容">
          <div className="space-y-2">
            {masters.workTypes.map((wt, i) => (
              <label
                key={wt.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
                  content.workTypeId === wt.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-surface-border"
                )}
              >
                <input
                  type="radio"
                  name="workType"
                  checked={content.workTypeId === wt.id}
                  onChange={() =>
                    setContent((c) => ({ ...c, workTypeId: wt.id }))
                  }
                />
                <span>
                  {circleNumber(i + 1)}
                  {wt.name}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold">機械</p>
            {content.machines.map((m, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 rounded-xl border p-2">
                <Input
                  label="機械名"
                  value={m.name}
                  onChange={(e) => {
                    const machines = [...content.machines];
                    machines[idx] = { ...m, name: e.target.value };
                    setContent((c) => ({ ...c, machines }));
                  }}
                />
                <Input
                  label="メーカー"
                  value={m.maker}
                  onChange={(e) => {
                    const machines = [...content.machines];
                    machines[idx] = { ...m, maker: e.target.value };
                    setContent((c) => ({ ...c, machines }));
                  }}
                />
                <Input
                  label="型式"
                  value={m.model}
                  onChange={(e) => {
                    const machines = [...content.machines];
                    machines[idx] = { ...m, model: e.target.value };
                    setContent((c) => ({ ...c, machines }));
                  }}
                />
                <Input
                  label="台数"
                  type="number"
                  value={m.qty}
                  onChange={(e) => {
                    const machines = [...content.machines];
                    machines[idx] = {
                      ...m,
                      qty: Number(e.target.value) || 1,
                    };
                    setContent((c) => ({ ...c, machines }));
                  }}
                />
              </div>
            ))}
            <Button variant="secondary" onClick={addMachineRow}>
              ＋ 行追加
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="車両・重機">
          <div className="grid grid-cols-3 gap-2">
            {masters.vehicles.map((v) => {
              const selected = vehicleMap.has(v.id);
              const note = vehicleMap.get(v.id)?.note ?? "";
              return (
                <div
                  key={v.id}
                  className={cn(
                    "rounded-xl border p-2 text-center text-xs",
                    selected
                      ? "border-brand-500 bg-brand-50"
                      : "border-surface-border"
                  )}
                >
                  <button
                    type="button"
                    className="w-full font-semibold"
                    onClick={() => toggleVehicle(v.id)}
                  >
                    {v.label}
                  </button>
                  {selected && (
                    <input
                      className="mt-1 w-full rounded border px-1 py-1 text-center"
                      placeholder={v.noteLabel ?? "備考"}
                      value={note}
                      onChange={(e) => setVehicleNote(v.id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card title="資材・その他">
          <div className="space-y-3">
            {masters.materials.map((mat) => {
              const val = getMaterialValue(mat.id);
              if (mat.inputType === "checkbox") {
                return (
                  <label
                    key={mat.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) =>
                        setMaterialValue(mat.id, e.target.checked)
                      }
                    />
                    {mat.name}
                  </label>
                );
              }
              return (
                <Input
                  key={mat.id}
                  label={`${mat.name}${mat.unit ? `（${mat.unit}）` : ""}`}
                  type={mat.inputType === "number" ? "number" : "text"}
                  value={val === undefined ? "" : String(val)}
                  onChange={(e) =>
                    setMaterialValue(
                      mat.id,
                      mat.inputType === "number"
                        ? Number(e.target.value)
                        : e.target.value
                    )
                  }
                />
              );
            })}
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card title="備考">
          <Textarea
            label="備考・特記"
            value={content.remarks ?? ""}
            onChange={(e) =>
              setContent((c) => ({ ...c, remarks: e.target.value }))
            }
            placeholder="音声入力結果や現場メモ"
          />
        </Card>
      )}

      {step === 6 && (
        <Card title="時間・経費">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="作業開始"
                type="time"
                value={content.siteWorkTime.from ?? ""}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    siteWorkTime: { ...c.siteWorkTime, from: e.target.value },
                  }))
                }
              />
              <Input
                label="作業終了"
                type="time"
                value={content.siteWorkTime.to ?? ""}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    siteWorkTime: { ...c.siteWorkTime, to: e.target.value },
                  }))
                }
              />
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={content.siteInspection}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      siteInspection: e.target.checked,
                    }))
                  }
                />
                下見 有
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={content.roadPermit}
                  onChange={(e) =>
                    setContent((c) => ({ ...c, roadPermit: e.target.checked }))
                  }
                />
                道路使用書 有
              </label>
            </div>
            <Input
              label="誘導員（名）"
              type="number"
              value={content.guidesCount ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  guidesCount: Number(e.target.value) || null,
                }))
              }
            />
            <Input
              label="高速代"
              type="number"
              value={content.costs.toll ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  costs: { ...c.costs, toll: Number(e.target.value) || null },
                }))
              }
            />
            <Input
              label="ガソリン代"
              type="number"
              value={content.costs.gasoline ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  costs: {
                    ...c.costs,
                    gasoline: Number(e.target.value) || null,
                  },
                }))
              }
            />
          </div>
        </Card>
      )}

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-mobile gap-2 border-t bg-white p-4">
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            戻る
          </Button>
        )}
        {step < 6 ? (
          <Button fullWidth onClick={() => setStep((s) => s + 1)}>
            次へ
          </Button>
        ) : (
          <Button fullWidth disabled={submitting} onClick={handleSubmit}>
            {submitting ? "送信中…" : "送信"}
          </Button>
        )}
      </div>
    </AppShell>
  );
}
