"use client";

import type {
  DailyReportContent,
  DailyReportMasters,
  MaterialValue,
  Project,
  VehicleSelection,
} from "@/lib/types";
import { circleNumber, cn } from "@/lib/utils";
import {
  Cell,
  InlineInput,
  PaperPage,
  YesNo,
} from "@/components/site-survey/ipad/FormPrimitives";

type Props = {
  projects: Project[];
  projectId: string;
  selectProject: (id: string) => void;
  masters: DailyReportMasters;
  content: DailyReportContent;
  setContent: React.Dispatch<React.SetStateAction<DailyReportContent>>;
  vehicleMap: Map<string, VehicleSelection>;
  toggleVehicle: (vehicleId: string) => void;
  setVehicleNote: (vehicleId: string, note: string) => void;
  setMaterialValue: (materialId: string, value: MaterialValue["value"]) => void;
  getMaterialValue: (materialId: string) => MaterialValue["value"] | undefined;
};

function reiwaYear(iso: string) {
  const y = new Date(`${iso}T00:00:00`).getFullYear();
  return y >= 2019 ? y - 2018 : y - 1988;
}

function parseIso(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

function toIso(year: number, month: number, day: number) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

const WEEKDAYS = "日月火水木金土";

function weekdayJa(iso: string) {
  return WEEKDAYS[new Date(`${iso}T00:00:00`).getDay()];
}

function VehicleTile({
  id,
  label,
  noteLabel,
  selected,
  note,
  onToggle,
  onNote,
}: {
  id: string;
  label: string;
  noteLabel?: string;
  selected: boolean;
  note: string;
  onToggle: () => void;
  onNote: (v: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[52px] flex-col items-center justify-center border border-slate-800 p-0.5 text-[10px]",
        selected && "bg-brand-50 ring-1 ring-inset ring-brand-500"
      )}
    >
      <button
        type="button"
        className="w-full px-0.5 py-0.5 font-semibold leading-tight"
        onClick={onToggle}
      >
        {label}
      </button>
      {(selected || noteLabel) && selected && (
        <InlineInput
          value={note}
          onChange={onNote}
          placeholder={noteLabel ?? ""}
          className="h-4 text-center text-[10px]"
        />
      )}
    </div>
  );
}

export function DailyReportScrollForm({
  projects,
  projectId,
  selectProject,
  masters,
  content,
  setContent,
  vehicleMap,
  toggleVehicle,
  setVehicleNote,
  setMaterialValue,
  getMaterialValue,
}: Props) {
  const start = parseIso(content.workDateStart || new Date().toISOString().slice(0, 10));
  const end = content.workDateEnd ? parseIso(content.workDateEnd) : null;
  const machine = content.machines[0] ?? {
    name: "",
    maker: "",
    model: "",
    qty: 1,
    unitNo: "",
  };

  const heavyVehicles = masters.vehicles.filter((v) => v.sortOrder <= 7);
  const lightVehicles = masters.vehicles.filter((v) => v.sortOrder > 7);

  function updateMachine(patch: Partial<typeof machine>) {
    setContent((c) => {
      const machines = [...c.machines];
      const current = machines[0] ?? machine;
      machines[0] = { ...current, ...patch };
      return { ...c, machines };
    });
  }

  function updateStartDate(part: "year" | "month" | "day", val: number) {
    const next = { ...start, [part]: val };
    setContent((c) => ({
      ...c,
      workDateStart: toIso(next.year, next.month, next.day),
    }));
  }

  function updateEndDate(part: "month" | "day", val: number) {
    const endYear = end?.year ?? start.year;
    const endMonth = part === "month" ? val : (end?.month ?? start.month);
    const endDay = part === "day" ? val : (end?.day ?? start.day);
    setContent((c) => ({
      ...c,
      workDateEnd: toIso(endYear, endMonth, endDay),
    }));
  }

  function updateCost(key: keyof DailyReportContent["costs"], val: string) {
    const num = val === "" ? null : Number(val);
    setContent((c) => ({
      ...c,
      costs: { ...c.costs, [key]: num },
    }));
  }

  return (
    <div className="mx-auto w-full max-w-[794px] space-y-6">
      <div className="rounded-lg border border-slate-300 bg-white p-3 text-sm">
        <label className="block space-y-1">
          <span className="font-medium text-slate-600">案件</span>
          <select
            className="w-full rounded-lg border border-surface-border px-3 py-2"
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
      </div>

      <PaperPage label="IMG_5182">
        <div className="flex h-full flex-col p-2">
          <h2 className="mb-2 text-center text-base font-bold tracking-[0.3em]">
            【 作 業 日 報 】
          </h2>

          <table className="w-full border-collapse text-[11px]">
            <tbody>
              {/* 請求先・担当者 */}
              <tr>
                <Cell className="w-16 bg-slate-50 font-medium">請求先名</Cell>
                <Cell colSpan={2}>
                  <InlineInput
                    value={content.billingClient}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, billingClient: v }))
                    }
                  />
                </Cell>
                <Cell className="w-14 bg-slate-50 font-medium">担当者</Cell>
                <Cell>
                  <InlineInput
                    value={content.clientContact ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, clientContact: v }))
                    }
                    placeholder="祝原 様"
                  />
                </Cell>
              </tr>

              {/* 作業年月日 */}
              <tr>
                <Cell className="whitespace-nowrap bg-slate-50 font-medium">
                  作業年月日
                </Cell>
                <Cell colSpan={4} className="align-middle">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex shrink-0 items-baseline whitespace-nowrap leading-snug">
                      令和
                      <InlineInput
                        compact
                        type="number"
                        inputMode="numeric"
                        value={reiwaYear(content.workDateStart)}
                        onChange={(v) => {
                          const n = Number(v);
                          if (!Number.isNaN(n) && v !== "") {
                            updateStartDate("year", n + 2018);
                          }
                        }}
                        className="w-7"
                      />
                      年
                      <InlineInput
                        compact
                        type="number"
                        inputMode="numeric"
                        value={start.month}
                        onChange={(v) => {
                          const n = Number(v);
                          if (!Number.isNaN(n) && v !== "") {
                            updateStartDate("month", n);
                          }
                        }}
                        className="w-6"
                      />
                      月
                      <InlineInput
                        compact
                        type="number"
                        inputMode="numeric"
                        value={start.day}
                        onChange={(v) => {
                          const n = Number(v);
                          if (!Number.isNaN(n) && v !== "") {
                            updateStartDate("day", n);
                          }
                        }}
                        className="w-6"
                      />
                      日（{weekdayJa(content.workDateStart)}）～
                      <InlineInput
                        compact
                        type="number"
                        inputMode="numeric"
                        value={end?.month ?? ""}
                        onChange={(v) => {
                          if (v === "") {
                            setContent((c) => ({ ...c, workDateEnd: null }));
                            return;
                          }
                          const n = Number(v);
                          if (!Number.isNaN(n)) updateEndDate("month", n);
                        }}
                        className="w-6"
                        placeholder=" "
                      />
                      月
                      <InlineInput
                        compact
                        type="number"
                        inputMode="numeric"
                        value={end?.day ?? ""}
                        onChange={(v) => {
                          if (v === "") {
                            setContent((c) => ({ ...c, workDateEnd: null }));
                            return;
                          }
                          const n = Number(v);
                          if (!Number.isNaN(n)) updateEndDate("day", n);
                        }}
                        className="w-6"
                        placeholder=" "
                      />
                      日（
                      {content.workDateEnd
                        ? weekdayJa(content.workDateEnd)
                        : "　"}
                      ）
                    </span>
                    <label className="ml-auto flex shrink-0 items-center gap-1 text-[10px] text-slate-500">
                      <span className="hidden sm:inline">カレンダー</span>
                      <input
                        type="date"
                        aria-label="作業日を選択"
                        value={content.workDateStart}
                        onChange={(e) =>
                          setContent((c) => ({
                            ...c,
                            workDateStart: e.target.value,
                          }))
                        }
                        className="h-7 rounded border border-slate-300 bg-white px-1 text-xs text-slate-800"
                      />
                    </label>
                  </div>
                </Cell>
              </tr>

              {/* 引取先 */}
              <tr>
                <Cell rowSpan={2} className="bg-slate-50 font-medium">
                  引取先
                </Cell>
                <Cell className="w-12 bg-slate-50">住所</Cell>
                <Cell colSpan={3}>
                  <InlineInput
                    value={content.pickup.address ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        pickup: { ...c.pickup, address: v },
                      }))
                    }
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50">会社名</Cell>
                <Cell colSpan={3}>
                  <InlineInput
                    value={content.pickup.company ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        pickup: { ...c.pickup, company: v },
                      }))
                    }
                  />
                </Cell>
              </tr>

              {/* 納入先 */}
              <tr>
                <Cell rowSpan={2} className="bg-slate-50 font-medium">
                  納入先
                </Cell>
                <Cell className="bg-slate-50">住所</Cell>
                <Cell colSpan={3}>
                  <InlineInput
                    value={content.delivery.address}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        delivery: { ...c.delivery, address: v },
                      }))
                    }
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50">会社名</Cell>
                <Cell colSpan={3}>
                  <InlineInput
                    value={content.delivery.company}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        delivery: { ...c.delivery, company: v },
                      }))
                    }
                  />
                </Cell>
              </tr>
            </tbody>
          </table>

          {/* 作業内容・機械表 */}
          <table className="mt-1 w-full border-collapse text-[10px]">
            <thead>
              <tr>
                <Cell className="bg-slate-50 text-center font-medium">
                  作業内容
                </Cell>
                <Cell className="bg-slate-50 text-center font-medium">
                  機械名
                </Cell>
                <Cell className="bg-slate-50 text-center font-medium">
                  メーカー
                </Cell>
                <Cell className="bg-slate-50 text-center font-medium">
                  型式
                </Cell>
                <Cell className="w-10 bg-slate-50 text-center font-medium">
                  台数
                </Cell>
                <Cell className="w-10 bg-slate-50 text-center font-medium">
                  号機
                </Cell>
              </tr>
            </thead>
            <tbody>
              {masters.workTypes.map((wt, i) => {
                const selected = content.workTypeId === wt.id;
                return (
                  <tr key={wt.id}>
                    <Cell className={cn(selected && "bg-brand-50")}>
                      <label className="flex cursor-pointer items-center gap-1">
                        <input
                          type="radio"
                          className="h-3 w-3 shrink-0"
                          checked={selected}
                          onChange={() =>
                            setContent((c) => ({ ...c, workTypeId: wt.id }))
                          }
                        />
                        <span>
                          {circleNumber(i + 1)}
                          {wt.name}
                        </span>
                      </label>
                    </Cell>
                    <Cell className={cn(selected && "bg-brand-50")}>
                      {selected ? (
                        <InlineInput
                          value={machine.name}
                          onChange={(v) => updateMachine({ name: v })}
                        />
                      ) : null}
                    </Cell>
                    <Cell className={cn(selected && "bg-brand-50")}>
                      {selected ? (
                        <InlineInput
                          value={machine.maker}
                          onChange={(v) => updateMachine({ maker: v })}
                        />
                      ) : null}
                    </Cell>
                    <Cell className={cn(selected && "bg-brand-50")}>
                      {selected ? (
                        <InlineInput
                          value={machine.model}
                          onChange={(v) => updateMachine({ model: v })}
                        />
                      ) : null}
                    </Cell>
                    <Cell className={cn(selected && "bg-brand-50")}>
                      {selected ? (
                        <InlineInput
                          type="number"
                          value={machine.qty}
                          onChange={(v) =>
                            updateMachine({ qty: Number(v) || 1 })
                          }
                          className="text-center"
                        />
                      ) : null}
                    </Cell>
                    <Cell className={cn(selected && "bg-brand-50")}>
                      {selected ? (
                        <InlineInput
                          value={machine.unitNo ?? ""}
                          onChange={(v) => updateMachine({ unitNo: v })}
                          className="text-center"
                        />
                      ) : null}
                    </Cell>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 車両・重機（上段） */}
          <div className="mt-1">
            <div
              className="grid gap-0"
              style={{
                gridTemplateColumns: `repeat(${heavyVehicles.length}, minmax(0, 1fr))`,
              }}
            >
              {heavyVehicles.map((v) => (
                <VehicleTile
                  key={v.id}
                  id={v.id}
                  label={v.label}
                  noteLabel={v.noteLabel}
                  selected={vehicleMap.has(v.id)}
                  note={vehicleMap.get(v.id)?.note ?? ""}
                  onToggle={() => toggleVehicle(v.id)}
                  onNote={(val) => setVehicleNote(v.id, val)}
                />
              ))}
            </div>
            <div
              className="mt-0 grid gap-0"
              style={{
                gridTemplateColumns: `repeat(${lightVehicles.length}, minmax(0, 1fr))`,
              }}
            >
              {lightVehicles.map((v) => (
                <VehicleTile
                  key={v.id}
                  id={v.id}
                  label={v.label}
                  noteLabel={v.noteLabel}
                  selected={vehicleMap.has(v.id)}
                  note={vehicleMap.get(v.id)?.note ?? ""}
                  onToggle={() => toggleVehicle(v.id)}
                  onNote={(val) => setVehicleNote(v.id, val)}
                />
              ))}
            </div>
          </div>

          {/* 資材行 */}
          <div className="mt-1 flex flex-wrap border border-slate-800">
            {masters.materials.map((mat) => {
              const val = getMaterialValue(mat.id);
              if (mat.inputType === "checkbox") {
                return (
                  <label
                    key={mat.id}
                    className="flex min-w-[72px] flex-1 items-center justify-center gap-1 border-r border-slate-800 px-1 py-1 text-[10px] last:border-r-0"
                  >
                    <input
                      type="checkbox"
                      className="h-3 w-3"
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
                <div
                  key={mat.id}
                  className="flex min-w-[72px] flex-1 items-center gap-0.5 border-r border-slate-800 px-1 py-0.5 text-[10px] last:border-r-0"
                >
                  <span className="shrink-0 whitespace-nowrap">{mat.name}</span>
                  <InlineInput
                    type={mat.inputType === "number" ? "number" : "text"}
                    value={val === undefined ? "" : String(val)}
                    onChange={(v) =>
                      setMaterialValue(
                        mat.id,
                        mat.inputType === "number" ? Number(v) : v
                      )
                    }
                    className="min-w-0 flex-1"
                  />
                  {mat.unit && (
                    <span className="shrink-0 text-[9px]">{mat.unit}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 備考 */}
          <div className="mt-1 flex-1 border border-slate-800">
            <textarea
              value={content.remarks ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, remarks: e.target.value }))
              }
              className="min-h-[72px] w-full resize-y border-0 bg-[repeating-linear-gradient(transparent,transparent_1.4rem,#e2e8f0_1.4rem,#e2e8f0_1.45rem)] px-2 py-1 text-[11px] leading-[1.45rem] outline-none"
              placeholder="備考・特記"
            />
          </div>

          {/* 時間・許可・経費 */}
          <table className="mt-1 w-full border-collapse text-[10px]">
            <tbody>
              <tr>
                <Cell className="w-28 bg-slate-50 font-medium">
                  マキノ現場
                  <br />
                  作業時間
                </Cell>
                <Cell className="w-32">
                  <span className="inline-flex items-center gap-1">
                    <InlineInput
                      type="time"
                      value={content.siteWorkTime.from ?? ""}
                      onChange={(v) =>
                        setContent((c) => ({
                          ...c,
                          siteWorkTime: { ...c.siteWorkTime, from: v },
                        }))
                      }
                      className="w-16"
                    />
                    ～
                    <InlineInput
                      type="time"
                      value={content.siteWorkTime.to ?? ""}
                      onChange={(v) =>
                        setContent((c) => ({
                          ...c,
                          siteWorkTime: { ...c.siteWorkTime, to: v },
                        }))
                      }
                      className="w-16"
                    />
                  </span>
                </Cell>
                <Cell className="w-20 bg-slate-50 font-medium">下見</Cell>
                <Cell className="w-24">
                  <YesNo
                    value={content.siteInspection ? "有" : "無"}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        siteInspection: v === "有",
                      }))
                    }
                  />
                </Cell>
                <Cell className="w-24 bg-slate-50 font-medium">
                  道路使用書
                </Cell>
                <Cell>
                  <YesNo
                    value={content.roadPermit ? "有" : "無"}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        roadPermit: v === "有",
                      }))
                    }
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">
                  高速・有料道路
                </Cell>
                <Cell>
                  <InlineInput
                    value={content.tollRoads[0] ?? ""}
                    onChange={(v) =>
                      setContent((c) => {
                        const tollRoads = [...c.tollRoads];
                        tollRoads[0] = v === "" ? null : Number(v);
                        return { ...c, tollRoads };
                      })
                    }
                    placeholder="1行目"
                  />
                </Cell>
                <Cell colSpan={2}>
                  <InlineInput
                    value={content.tollRoads[1] ?? ""}
                    onChange={(v) =>
                      setContent((c) => {
                        const tollRoads = [...c.tollRoads];
                        tollRoads[1] = v === "" ? null : Number(v);
                        return { ...c, tollRoads };
                      })
                    }
                    placeholder="2行目"
                  />
                </Cell>
                <Cell className="bg-slate-50 font-medium">誘導員</Cell>
                <Cell>
                  <span className="inline-flex items-center gap-1">
                    <InlineInput
                      type="number"
                      value={content.guidesCount ?? ""}
                      onChange={(v) =>
                        setContent((c) => ({
                          ...c,
                          guidesCount: v === "" ? null : Number(v),
                        }))
                      }
                      className="w-10 text-center"
                    />
                    名
                  </span>
                </Cell>
              </tr>
            </tbody>
          </table>

          {/* 経費表 */}
          <table className="mt-1 w-full border-collapse text-[10px]">
            <tbody>
              <tr>
                <Cell className="w-1/4 bg-slate-50">人件費</Cell>
                <Cell className="w-1/4">
                  <InlineInput
                    type="number"
                    value={content.costs.labor ?? ""}
                    onChange={(v) => updateCost("labor", v)}
                  />
                </Cell>
                <Cell className="w-1/4 bg-slate-50">車輌代</Cell>
                <Cell className="w-1/4">
                  <InlineInput
                    type="number"
                    value={content.costs.vehicle ?? ""}
                    onChange={(v) => updateCost("vehicle", v)}
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50">高速代</Cell>
                <Cell>
                  <InlineInput
                    type="number"
                    value={content.costs.toll ?? ""}
                    onChange={(v) => updateCost("toll", v)}
                  />
                </Cell>
                <Cell className="bg-slate-50">ガソリン代</Cell>
                <Cell>
                  <InlineInput
                    type="number"
                    value={content.costs.gasoline ?? ""}
                    onChange={(v) => updateCost("gasoline", v)}
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50">消耗品代</Cell>
                <Cell>
                  <InlineInput
                    type="number"
                    value={content.costs.consumables ?? ""}
                    onChange={(v) => updateCost("consumables", v)}
                  />
                </Cell>
                <Cell className="bg-slate-50">外部人工</Cell>
                <Cell>
                  <InlineInput
                    type="number"
                    value={content.costs.externalLabor ?? ""}
                    onChange={(v) => updateCost("externalLabor", v)}
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50">経費</Cell>
                <Cell>
                  <InlineInput
                    type="number"
                    value={content.costs.expense ?? ""}
                    onChange={(v) => updateCost("expense", v)}
                  />
                </Cell>
                <Cell className="bg-slate-50">外注費</Cell>
                <Cell>
                  <InlineInput
                    type="number"
                    value={content.costs.outsource ?? ""}
                    onChange={(v) => updateCost("outsource", v)}
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">総経費</Cell>
                <Cell>
                  <InlineInput
                    type="number"
                    value={content.costs.total ?? ""}
                    onChange={(v) => updateCost("total", v)}
                  />
                </Cell>
                <Cell className="bg-slate-50 font-medium">担当</Cell>
                <Cell>
                  <InlineInput
                    value={content.reporterName ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, reporterName: v }))
                    }
                  />
                </Cell>
              </tr>
            </tbody>
          </table>
        </div>
      </PaperPage>
    </div>
  );
}
