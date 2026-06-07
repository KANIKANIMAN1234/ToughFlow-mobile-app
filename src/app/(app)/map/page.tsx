"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CustomerSiteMapRoot } from "@/components/map/CustomerSiteMap";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePermissions } from "@/hooks/usePermissions";

export default function MapPage() {
  const { user, authLoading } = useAuthGuard();
  const { canAccess, loading: permLoading } = usePermissions();

  const allowed =
    canAccess("project_list_other") ||
    canAccess("daily_report_register") ||
    canAccess("site_survey_register");

  if (authLoading || permLoading || !user) {
    return (
      <AppShell title="地図">
        <CardListSkeleton />
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell title="地図">
        <p className="text-caption text-apple-glyph">この画面を表示する権限がありません。</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="地図">
      <CustomerSiteMapRoot enabled={allowed} />
    </AppShell>
  );
}
