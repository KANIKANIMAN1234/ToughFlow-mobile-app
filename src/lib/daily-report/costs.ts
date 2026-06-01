import type { DailyReportCosts } from "@/lib/types";

const COST_SUM_KEYS = [
  "labor",
  "toll",
  "consumables",
  "expense",
  "vehicle",
  "gasoline",
  "externalLabor",
  "outsource",
] as const satisfies ReadonlyArray<keyof DailyReportCosts>;

/** 総経費 = 人件費〜外注費の合計（担当は含まない） */
export function calcDailyReportTotalCosts(
  costs: DailyReportCosts
): number | null {
  let hasAny = false;
  let sum = 0;
  for (const key of COST_SUM_KEYS) {
    const v = costs[key];
    if (v != null && !Number.isNaN(v)) {
      hasAny = true;
      sum += v;
    }
  }
  return hasAny ? sum : null;
}

export type DailyReportCostInputKey = (typeof COST_SUM_KEYS)[number];

export { COST_SUM_KEYS };
