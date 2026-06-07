"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Clock, FileText, Map, MapPin, Receipt } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { HomeSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { isAccessGranted } from "@/lib/permissions/access";
import type { AccessLevel } from "@/lib/types";

type HomeShortcut = {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  permissions: string[];
};

const HOME_SHORTCUTS: HomeShortcut[] = [
  {
    href: "/expenses/new",
    label: "立替精算",
    desc: "領収書撮影・OCR",
    icon: Receipt,
    color: "bg-emerald-50 text-emerald-700",
    permissions: ["expense_register"],
  },
  {
    href: "/attendance",
    label: "出退勤",
    desc: "打刻・勤怠記録",
    icon: Clock,
    color: "bg-slate-100 text-slate-700",
    permissions: ["attendance_register"],
  },
  {
    href: "/daily-reports/new",
    label: "作業日報",
    desc: "現場作業の報告",
    icon: FileText,
    color: "bg-brand-50 text-brand-700",
    permissions: ["daily_report_register"],
  },
  {
    href: "/map",
    label: "地図",
    desc: "現場の位置確認",
    icon: Map,
    color: "bg-sky-50 text-sky-700",
    permissions: [
      "project_list_other",
      "daily_report_register",
      "site_survey_register",
    ],
  },
  {
    href: "/site-surveys/new",
    label: "現地調査",
    desc: "下見・搬入条件",
    icon: MapPin,
    color: "bg-amber-50 text-amber-700",
    permissions: ["site_survey_register", "site_survey_view_shared"],
  },
];

function canShowShortcut(
  permissions: string[],
  accessMap: Record<string, AccessLevel>
) {
  return permissions.some((code) =>
    isAccessGranted(accessMap[code] ?? "deny")
  );
}

type Reminders = {
  draftExpenses: number;
  draftDailyReports: number;
};

export default function HomePage() {
  const { user, authLoading } = useAuthGuard();
  const { accessMap, loading: permLoading } = usePermissions();
  const { data: reminderData } = useApi<{ reminders: Reminders }>(
    user ? "/api/reminders" : null
  );

  const shortcuts = HOME_SHORTCUTS.filter((item) =>
    canShowShortcut(item.permissions, accessMap)
  );

  const reminders = reminderData?.reminders ?? {
    draftExpenses: 0,
    draftDailyReports: 0,
  };
  const hasReminders =
    reminders.draftExpenses > 0 || reminders.draftDailyReports > 0;

  if (authLoading || permLoading || !user) {
    return (
      <AppShell title="ホーム">
        <HomeSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="ホーム">
      <Card title={`こんにちは、${user.name} さん`}>
        <p className="text-caption text-apple-glyph">
          今日の現場作業を記録しましょう。30秒で操作できるクイックアクションから選べます。
        </p>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {shortcuts.map(({ href, label, desc, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-[7.5rem] flex-col items-center justify-center rounded-card border border-surface-border bg-white p-3 text-center transition-transform active:scale-[0.98]"
          >
            <div className={`rounded-xl p-2.5 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-2 text-caption font-normal text-apple-text">{label}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-apple-glyph">{desc}</p>
          </Link>
        ))}
      </div>

      <Card title="未提出リマインド" className="mt-4">
        {hasReminders ? (
          <ul className="space-y-2 text-caption text-apple-text">
            {reminders.draftDailyReports > 0 && (
              <li>
                <Link href="/daily-reports" className="text-apple-link">
                  作業日報の下書きが {reminders.draftDailyReports} 件あります
                </Link>
              </li>
            )}
            {reminders.draftExpenses > 0 && (
              <li>
                <Link href="/expenses" className="text-apple-link">
                  立替精算の下書きが {reminders.draftExpenses} 件あります
                </Link>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-caption text-apple-glyph">
            未提出の下書きはありません
          </p>
        )}
      </Card>
    </AppShell>
  );
}
