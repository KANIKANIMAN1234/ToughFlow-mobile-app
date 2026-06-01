"use client";

import type { Project, SiteSurveyContent, SiteSurveyMasters } from "@/lib/types";
import {
  Cell,
  InlineInput,
  PaperPage,
  YesNo,
} from "./FormPrimitives";
import { SiteSurveyPhotoEntries } from "@/components/site-survey/SiteSurveyPhotoEntries";

type Props = {
  projects: Project[];
  projectId: string;
  selectProject: (id: string) => void;
  masters: SiteSurveyMasters;
  content: SiteSurveyContent;
  setContent: React.Dispatch<React.SetStateAction<SiteSurveyContent>>;
};

function setPhoto(
  setContent: Props["setContent"],
  key: keyof SiteSurveyContent["photos"],
  file: File | undefined
) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  setContent((c) => ({ ...c, photos: { ...c.photos, [key]: url } }));
}

export function SiteSurveyScrollForm({
  projects,
  projectId,
  selectProject,
  masters,
  content,
  setContent,
}: Props) {
  const toolPairs: Array<
    [
      SiteSurveyContent["tools"][0] | undefined,
      SiteSurveyContent["tools"][0] | undefined,
    ]
  > = [];
  for (let i = 0; i < content.tools.length; i += 2) {
    toolPairs.push([content.tools[i], content.tools[i + 1]]);
  }
  const minToolRows = 18;
  while (toolPairs.length < minToolRows) {
    toolPairs.push([undefined, undefined]);
  }

  function updateTool(
    index: number,
    patch: Partial<SiteSurveyContent["tools"][0]>
  ) {
    setContent((c) => {
      const tools = [...c.tools];
      while (tools.length <= index) {
        tools.push({ toolId: null, name: "", load: false, use: false });
      }
      tools[index] = { ...tools[index], ...patch };
      return { ...c, tools };
    });
  }

  function renderToolCell(
    tool: SiteSurveyContent["tools"][0] | undefined,
    index: number
  ) {
    if (!tool && index >= content.tools.length) {
      return (
        <>
          <Cell className="w-8 text-center" />
          <Cell className="w-8 text-center" />
          <Cell />
        </>
      );
    }
    const t = tool ?? { toolId: null, name: "", load: false, use: false };
    return (
      <>
        <Cell className="w-8 text-center">
          <input
            type="checkbox"
            className="h-3.5 w-3.5"
            checked={t.load}
            onChange={(e) => updateTool(index, { load: e.target.checked })}
          />
        </Cell>
        <Cell className="w-8 text-center">
          <input
            type="checkbox"
            className="h-3.5 w-3.5"
            checked={t.use}
            onChange={(e) => updateTool(index, { use: e.target.checked })}
          />
        </Cell>
        <Cell>
          {t.toolId ? (
            <span>{t.name}</span>
          ) : (
            <InlineInput
              value={t.name}
              onChange={(v) => updateTool(index, { name: v })}
              placeholder="道具名"
            />
          )}
        </Cell>
      </>
    );
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

      <PaperPage label="1/2 — IMG_5180">
        <div className="p-3">
          <h2 className="mb-3 text-center text-lg font-bold tracking-widest">
            現 地 調 査 報 告 書
          </h2>

          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <Cell className="w-24 bg-slate-50 font-medium">お客様名</Cell>
                <Cell colSpan={3}>
                  <InlineInput
                    value={content.customerName}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, customerName: v }))
                    }
                  />
                </Cell>
                <Cell className="w-28 bg-slate-50 text-center font-medium">
                  見積書
                </Cell>
                <Cell>
                  <YesNo
                    value={content.hasEstimate ? "有" : "無"}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, hasEstimate: v === "有" }))
                    }
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">下見日</Cell>
                <Cell colSpan={2}>
                  <InlineInput
                    type="date"
                    value={content.surveyDate}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, surveyDate: v }))
                    }
                  />
                </Cell>
                <Cell className="bg-slate-50 font-medium">調査担当</Cell>
                <Cell colSpan={2}>
                  <InlineInput
                    value={content.surveyorName}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, surveyorName: v }))
                    }
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">住所</Cell>
                <Cell colSpan={5}>
                  <InlineInput
                    value={content.siteAddress}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, siteAddress: v }))
                    }
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">電話</Cell>
                <Cell colSpan={2}>
                  <InlineInput
                    value={content.contactPhone ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, contactPhone: v }))
                    }
                  />
                </Cell>
                <Cell className="bg-slate-50 font-medium">客先担当</Cell>
                <Cell colSpan={2}>
                  <InlineInput
                    value={content.customerContact ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, customerContact: v }))
                    }
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">作業日時</Cell>
                <Cell colSpan={2}>
                  <InlineInput
                    type="datetime-local"
                    value={
                      content.workDatetime.includes("T")
                        ? content.workDatetime.slice(0, 16)
                        : `${content.workDatetime}T09:00`
                    }
                    onChange={(v) =>
                      setContent((c) => ({ ...c, workDatetime: v }))
                    }
                  />
                </Cell>
                <Cell className="bg-slate-50 font-medium">作業内容</Cell>
                <Cell colSpan={2}>
                  <span className="flex flex-wrap gap-3">
                    {masters.workTypes.map((wt) => (
                      <label
                        key={wt.id}
                        className="inline-flex items-center gap-1"
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
                  </span>
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">機種</Cell>
                <Cell colSpan={5}>
                  <span className="text-slate-500">
                    メーカー名（モデル名）：
                  </span>
                  <InlineInput
                    value={content.machineModel}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, machineModel: v }))
                    }
                  />
                </Cell>
              </tr>
            </tbody>
          </table>

          <table className="mt-2 w-full border-collapse text-xs">
            <tbody>
              <tr>
                <Cell
                  rowSpan={6}
                  className="w-10 bg-slate-100 text-center align-middle font-bold [writing-mode:vertical-rl]"
                >
                  搬入状況
                </Cell>
                <Cell className="w-16 bg-slate-50 font-medium">搬入口</Cell>
                <Cell colSpan={4}>
                  搬入口 高 H{" "}
                  <InlineInput
                    type="number"
                    className="inline-block w-16"
                    value={content.entrance.heightMm ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        entrance: {
                          ...c.entrance,
                          heightMm: Number(v) || undefined,
                        },
                      }))
                    }
                  />
                  mm × 幅 W{" "}
                  <InlineInput
                    type="number"
                    className="inline-block w-16"
                    value={content.entrance.widthMm ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        entrance: {
                          ...c.entrance,
                          widthMm: Number(v) || undefined,
                        },
                      }))
                    }
                  />
                  mm
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      ひさし{" "}
                      <YesNo
                        value={content.entrance.eaves ?? "無"}
                        onChange={(v) =>
                          setContent((c) => ({
                            ...c,
                            entrance: { ...c.entrance, eaves: v },
                          }))
                        }
                      />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      スロープ{" "}
                      <YesNo
                        value={content.entrance.slope ?? "無"}
                        onChange={(v) =>
                          setContent((c) => ({
                            ...c,
                            entrance: { ...c.entrance, slope: v },
                          }))
                        }
                      />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      段差{" "}
                      <YesNo
                        value={content.entrance.step ?? "無"}
                        onChange={(v) =>
                          setContent((c) => ({
                            ...c,
                            entrance: { ...c.entrance, step: v },
                          }))
                        }
                      />
                    </span>
                  </div>
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">車両</Cell>
                <Cell colSpan={4}>
                  <span className="text-slate-600">使用予定車両・重機</span>
                  <textarea
                    className="mt-1 min-h-[3rem] w-full resize-y border border-slate-300 p-1 text-xs"
                    value={content.plannedVehicles.join("\n")}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        plannedVehicles: e.target.value
                          .split("\n")
                          .filter(Boolean),
                      }))
                    }
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">荷卸</Cell>
                <Cell colSpan={4}>
                  床面{" "}
                  <InlineInput
                    className="inline-block w-32"
                    value={content.unload.floor ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        unload: { ...c.unload, floor: v },
                      }))
                    }
                  />
                  ③ブルーシート{" "}
                  <InlineInput
                    type="number"
                    className="inline-block w-12"
                    value={content.unload.blueSheetM ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        unload: {
                          ...c.unload,
                          blueSheetM: Number(v) || undefined,
                        },
                      }))
                    }
                  />
                  m　床養生{" "}
                  <YesNo
                    value={content.unload.floorProtection ?? "不要"}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        unload: { ...c.unload, floorProtection: v },
                      }))
                    }
                    labels={["不要", "要"]}
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">客先設備</Cell>
                <Cell colSpan={4}>
                  <div className="space-y-1">
                    <div>
                      天井クレーン{" "}
                      <YesNo
                        value={content.facility.overheadCrane ?? "無"}
                        onChange={(v) =>
                          setContent((c) => ({
                            ...c,
                            facility: { ...c.facility, overheadCrane: v },
                          }))
                        }
                      />
                    </div>
                    <div>
                      フォークリフト{" "}
                      <YesNo
                        value={content.facility.forklift ?? "無"}
                        onChange={(v) =>
                          setContent((c) => ({
                            ...c,
                            facility: { ...c.facility, forklift: v },
                          }))
                        }
                      />
                    </div>
                    <div>
                      その他{" "}
                      <InlineInput
                        className="inline-block w-48"
                        value={content.facility.other ?? ""}
                        onChange={(v) =>
                          setContent((c) => ({
                            ...c,
                            facility: { ...c.facility, other: v },
                          }))
                        }
                      />
                    </div>
                  </div>
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">機械移動</Cell>
                <Cell colSpan={4}>
                  工場内機械移動{" "}
                  <YesNo
                    value={content.internalMove ?? "無"}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, internalMove: v }))
                    }
                  />
                </Cell>
              </tr>
              <tr>
                <Cell className="bg-slate-50 font-medium">必要道具</Cell>
                <Cell colSpan={4}>
                  <InlineInput
                    value={content.requiredToolsNote ?? ""}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, requiredToolsNote: v }))
                    }
                    placeholder="（搬入状況欄メモ）"
                  />
                </Cell>
              </tr>
            </tbody>
          </table>

          <div className="mt-2 grid grid-cols-2 border border-slate-800">
            <div className="border-r border-slate-800 p-2">
              <p className="mb-1 text-center text-xs font-medium">
                搬入場所地図
              </p>
              <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center border border-dashed border-slate-400 bg-slate-50 text-slate-500">
                📷 撮影 / 選択
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setPhoto(setContent, "mapCarryIn", e.target.files?.[0])
                  }
                />
              </label>
              {content.photos.mapCarryIn && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.photos.mapCarryIn}
                  alt="搬入場所"
                  className="mt-1 max-h-32 w-full object-contain"
                />
              )}
            </div>
            <div className="p-2">
              <p className="mb-1 text-center text-xs font-medium">
                工場内敷地配置図
                <span className="block text-[10px] font-normal text-slate-500">
                  （レッカー、養生、搬入経路）
                </span>
              </p>
              <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center border border-dashed border-slate-400 bg-slate-50 text-slate-500">
                📷 撮影 / 選択
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setPhoto(setContent, "siteLayout", e.target.files?.[0])
                  }
                />
              </label>
              {content.photos.siteLayout && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.photos.siteLayout}
                  alt="配置図"
                  className="mt-1 max-h-32 w-full object-contain"
                />
              )}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 border border-slate-800">
            <div className="border-r border-slate-800 p-2">
              <p className="mb-1 font-medium">作業内容</p>
              <textarea
                className="min-h-[160px] w-full resize-y border border-slate-300 p-2 text-xs leading-relaxed"
                value={content.workSteps.join("\n")}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    workSteps: e.target.value.split("\n"),
                  }))
                }
                placeholder="1行1項目"
              />
            </div>
            <div className="p-2">
              <p className="mb-1 font-medium">注意点（搬入、危険箇所等）</p>
              <textarea
                className="min-h-[160px] w-full resize-y border border-slate-300 p-2 text-xs leading-relaxed"
                value={content.precautions.join("\n")}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    precautions: e.target.value.split("\n"),
                  }))
                }
                placeholder="1行1項目"
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end text-xs">
            予定作業者数（{" "}
            <InlineInput
              type="number"
              className="inline-block w-12 text-center"
              value={content.plannedWorkers ?? ""}
              onChange={(v) =>
                setContent((c) => ({
                  ...c,
                  plannedWorkers: Number(v) || undefined,
                }))
              }
            />{" "}
            ）名
          </div>
        </div>
      </PaperPage>

      <PaperPage label="2/2 — IMG_5181">
        <div className="p-3">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Cell colSpan={6} className="bg-slate-50">
                  <span className="mr-4 font-medium">日</span>
                  <InlineInput
                    type="date"
                    className="inline-block w-36"
                    value={content.surveyDate}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, surveyDate: v }))
                    }
                  />
                </Cell>
              </tr>
              <tr className="bg-slate-100 text-center font-medium">
                <Cell className="w-8">積</Cell>
                <Cell className="w-8">使</Cell>
                <Cell>道具</Cell>
                <Cell className="w-8">積</Cell>
                <Cell className="w-8">使</Cell>
                <Cell>道具</Cell>
              </tr>
            </thead>
            <tbody>
              {toolPairs.map(([left, right], rowIdx) => {
                const leftIdx = rowIdx * 2;
                const rightIdx = rowIdx * 2 + 1;
                return (
                  <tr key={rowIdx}>
                    {renderToolCell(left, leftIdx)}
                    {renderToolCell(right, rightIdx)}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="text-xs text-brand-600 underline"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  tools: [
                    ...c.tools,
                    { toolId: null, name: "", load: false, use: false },
                  ],
                }))
              }
            >
              ＋ 道具行を追加（右列用）
            </button>
          </div>

          <div className="mt-6 border border-slate-800 p-3">
            <p className="mb-2 text-center text-sm font-medium">
              現場調査写真（PDF 3ページ目）
            </p>
            <SiteSurveyPhotoEntries
              content={content}
              setContent={setContent}
              variant="paper"
            />
          </div>
        </div>
      </PaperPage>
    </div>
  );
}
