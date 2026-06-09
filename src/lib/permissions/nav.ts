import type { AccessLevel } from "@/lib/types";
import type { PermissionCode } from "./check";

export type NavItemDef = {
  href: string;
  label: string;
  permissions?: PermissionCode[];
};

export const MOBILE_NAV_ITEMS: NavItemDef[] = [
  { href: "/home", label: "ホーム" },
  {
    href: "/attendance",
    label: "勤怠",
    permissions: ["attendance_register"],
  },
  {
    href: "/expenses/new",
    label: "清算",
    permissions: ["expense_register"],
  },
  {
    href: "/daily-reports/new",
    label: "日報",
    permissions: ["daily_report_register"],
  },
  {
    href: "/site-surveys/new",
    label: "現調",
    permissions: ["site_survey_register", "site_survey_view_shared"],
  },
  {
    href: "/map",
    label: "地図",
    permissions: [
      "project_list_other",
      "daily_report_register",
      "site_survey_register",
    ],
  },
  {
    href: "/projects",
    label: "案件",
    permissions: ["project_list_other", "daily_report_register", "site_survey_register"],
  },
  {
    href: "/reports",
    label: "各報",
    permissions: [
      "site_survey_register",
      "site_survey_view_shared",
      "daily_report_register",
      "daily_report_view_all",
    ],
  },
];

export function filterNavByAccess(
  items: NavItemDef[],
  accessMap: Record<string, AccessLevel>
): NavItemDef[] {
  return items.filter((item) => {
    if (!item.permissions?.length) return true;
    return item.permissions.some((code) => {
      const level = accessMap[code] ?? "deny";
      return level === "allow" || level === "conditional";
    });
  });
}
