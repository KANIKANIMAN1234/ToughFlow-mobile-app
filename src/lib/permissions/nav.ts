import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Clock,
  FileText,
  Home,
  MapPin,
  Receipt,
} from "lucide-react";
import type { AccessLevel } from "@/lib/types";
import type { PermissionCode } from "./check";

export type NavItemDef = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions?: PermissionCode[];
};

export const MOBILE_NAV_ITEMS: NavItemDef[] = [
  { href: "/home", label: "ホーム", icon: Home },
  {
    href: "/attendance",
    label: "出退勤",
    icon: Clock,
    permissions: ["attendance_register"],
  },
  {
    href: "/expenses/new",
    label: "立替精算",
    icon: Receipt,
    permissions: ["expense_register"],
  },
  {
    href: "/daily-reports/new",
    label: "作業日報",
    icon: FileText,
    permissions: ["daily_report_register"],
  },
  {
    href: "/site-surveys/new",
    label: "現地調査",
    icon: MapPin,
    permissions: ["site_survey_register", "site_survey_view_shared"],
  },
  {
    href: "/projects",
    label: "案件",
    icon: ClipboardList,
    permissions: ["project_list_other", "daily_report_register", "site_survey_register"],
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
