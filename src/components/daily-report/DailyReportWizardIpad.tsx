"use client";

import { AppShell } from "@/components/layout/AppShell";
import { IpadWizardLayout } from "@/components/layout/IpadWizardLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  DAILY_REPORT_STEPS,
  useDailyReportWizard,
} from "@/hooks/useDailyReportWizard";
import { circleNumber, cn } from "@/lib/utils";

export function DailyReportWizardIpad() {
  const wizard = useDailyReportWizard();
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
  } = wizard;

  if (!masters) {
    return (
      <AppShell title="作業日報">
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
      {step < 6 ? (
        <Button fullWidth onClick={() => setStep((s) => s + 1)}>
          次へ
        </Button>
      ) : (
        <>
          <Button variant="secondary" disabled>
            PDFプレビュー
          </Button>
          <Button fullWidth disabled={submitting} onClick={handleSubmit}>
            {submitting ? "送信中…" : "送信"}
          </Button>
        </>
      )}
    </div>
  );

  return (
    <AppShell title="作業日報入力（iPad）">
      <IpadWizardLayout
        title="作業日報"
        steps={[...DAILY_REPORT_STEPS]}
        currentStep={step}
        onStepChange={setStep}
        footer={footer}
      >
        {step === 1 && (
          <Card title="【 作 業 日 報 】 基本情報">
            <div className="grid gap-4 lg:grid-cols-2">
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
              </div>
              <div className="space-y-3">
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
            </div>
          </Card>
        )}

        {step === 2 && (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card title="作業種別">
              <div className="grid gap-2 sm:grid-cols-2">
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
                      name="workTypeIpad"
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
            </Card>
            <Card title="機械">
              <div className="space-y-2">
                {content.machines.map((m, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-4 gap-2 rounded-xl border p-2"
                  >
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
          </div>
        )}

        {step === 3 && (
          <Card title="車両・重機">
            <div className="grid grid-cols-4 gap-3 xl:grid-cols-6">
              {masters.vehicles.map((v) => {
                const selected = vehicleMap.has(v.id);
                const note = vehicleMap.get(v.id)?.note ?? "";
                return (
                  <div
                    key={v.id}
                    className={cn(
                      "rounded-xl border p-3 text-center text-sm",
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
                        className="mt-2 w-full rounded border px-2 py-1 text-center text-xs"
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {masters.materials.map((mat) => {
                const val = getMaterialValue(mat.id);
                if (mat.inputType === "checkbox") {
                  return (
                    <label
                      key={mat.id}
                      className="flex items-center gap-2 rounded-xl border px-3 py-3 text-sm"
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="時間・チェック">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="作業開始"
                    type="time"
                    value={content.siteWorkTime.from ?? ""}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        siteWorkTime: {
                          ...c.siteWorkTime,
                          from: e.target.value,
                        },
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
                        setContent((c) => ({
                          ...c,
                          roadPermit: e.target.checked,
                        }))
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
              </div>
            </Card>
            <Card title="経費">
              <div className="space-y-3">
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
          </div>
        )}
      </IpadWizardLayout>
    </AppShell>
  );
}
