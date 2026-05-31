"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, MapPin, Receipt } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";

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
    color: "bg-blue-50 text-blue-700",
  },
  {
    href: "/site-surveys/new",
    label: "現地調査",
    desc: "下見・搬入条件",
    icon: MapPin,
    color: "bg-amber-50 text-amber-700",
  },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <AppShell title="ホーム">
      <Card title={`こんにちは、${user.name} さん`}>
        <p className="text-sm text-slate-600">
          今日の現場作業を記録しましょう。30秒で操作できるクイックアクションから選べます。
        </p>
      </Card>

      <div className="mt-4 space-y-3">
        {actions.map(({ href, label, desc, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-surface-border bg-white p-4 shadow-sm active:scale-[0.99]"
          >
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <Card title="未提出リマインド" className="mt-4">
        <p className="text-sm text-slate-500">
          本日の作業日報・経費の未提出はありません（デモ）
        </p>
      </Card>
    </AppShell>
  );
}
