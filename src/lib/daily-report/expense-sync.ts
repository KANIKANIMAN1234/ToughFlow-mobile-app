import type { DailyReportCosts, Expense } from "@/lib/types";
import { calcDailyReportTotalCosts } from "@/lib/daily-report/costs";

/** 立替精算（M7）→ 作業日報経費欄のマッピング */
const CATEGORY_NAME_TO_COST: Record<string, keyof DailyReportCosts> = {
  高速代: "toll",
  ガソリン代: "gasoline",
  消耗品: "consumables",
  消耗品代: "consumables",
  駐車場: "expense",
  その他: "expense",
};

const REIMBURSEMENT_STATUSES = new Set<Expense["status"]>([
  "submitted",
  "approved",
]);

export type ReimbursementCostFields = Pick<
  DailyReportCosts,
  "toll" | "gasoline" | "consumables" | "expense"
>;

function mapCategoryToCostKey(
  categoryName: string,
  categoryId: string
): keyof DailyReportCosts | null {
  const byName = CATEGORY_NAME_TO_COST[categoryName.trim()];
  if (byName) return byName;

  if (categoryId.endsWith("-1")) return "toll";
  if (categoryId.endsWith("-2")) return "gasoline";
  if (categoryId.endsWith("-3")) return "consumables";
  if (categoryId.endsWith("-4") || categoryId.endsWith("-5")) return "expense";

  return null;
}

/** 立替精算一覧を日報の経費4項目に集計 */
export function aggregateExpensesToCosts(
  expenses: Expense[]
): ReimbursementCostFields {
  const sums: Record<keyof ReimbursementCostFields, number> = {
    toll: 0,
    gasoline: 0,
    consumables: 0,
    expense: 0,
  };
  const has: Record<keyof ReimbursementCostFields, boolean> = {
    toll: false,
    gasoline: false,
    consumables: false,
    expense: false,
  };

  for (const exp of expenses) {
    if (!REIMBURSEMENT_STATUSES.has(exp.status)) continue;
    const key = mapCategoryToCostKey(exp.categoryName, exp.categoryId);
    if (
      key !== "toll" &&
      key !== "gasoline" &&
      key !== "consumables" &&
      key !== "expense"
    ) {
      continue;
    }
    has[key] = true;
    sums[key] += exp.amount;
  }

  return {
    toll: has.toll ? sums.toll : null,
    gasoline: has.gasoline ? sums.gasoline : null,
    consumables: has.consumables ? sums.consumables : null,
    expense: has.expense ? sums.expense : null,
  };
}

/** 手入力の経費（人件費等）を残し、立替分4項目だけ上書きして総経費を再計算 */
export function mergeReimbursementIntoCosts(
  current: DailyReportCosts,
  reimbursement: ReimbursementCostFields
): DailyReportCosts {
  const merged: DailyReportCosts = {
    ...current,
    toll: reimbursement.toll,
    gasoline: reimbursement.gasoline,
    consumables: reimbursement.consumables,
    expense: reimbursement.expense,
  };
  merged.total = calcDailyReportTotalCosts(merged);
  return merged;
}
