"use client";

import Link from "next/link";
import { FileText, MapPin, Receipt } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { HomeSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const actions = [
  {
    href: "/expenses/new",
    label: "立替精算",
    desc: "領収書撮影・OCR",
    icon: Receipt,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/daily-reports/new",
    label: "作業日報",
    desc: "現場作業の報告",
    icon: FileText,
    color: "bg-brand-50 text-brand-700",
  },
  {
    href: "/site-surveys/new",
    label: "現地調査",
    desc: "下見・搬入条件",
    icon: MapPin,
    color: "bg-amber-50 text-amber-700",
  },
];

type Reminders = {
  draftExpenses: number;
  draftDailyReports: number;
};

export default function HomePage() {
  const { user, authLoading } = useAuthGuard();
  const { data: reminderData } = useApi<{ reminders: Reminders }>(
    user ? "/api/reminders" : null
  );

  const reminders = reminderData?.reminders ?? {
    draftExpenses: 0,
    draftDailyReports: 0,
  };
  const hasReminders =
    reminders.draftExpenses > 0 || reminders.draftDailyReports > 0;

  if (authLoading || !user) {
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

      <div className="mt-4 space-y-3">
        {actions.map(({ href, label, desc, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-card border border-surface-border bg-white p-4 transition-transform active:scale-[0.99]"
          >
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-normal text-body text-apple-text">{label}</p>
              <p className="text-nav-link text-apple-glyph">{desc}</p>
            </div>
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
