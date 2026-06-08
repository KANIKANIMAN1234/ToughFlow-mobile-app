"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CustomerSiteMapRoot } from "@/components/map/CustomerSiteMap";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

export default function MapPage() {
  const { user, authLoading } = useAuthGuard();
  const { canAccess, loading: permLoading } = usePermissions();
  const { isTablet } = useDisplayMode();

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
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isTablet ? "-mx-6 -my-5" : "-mx-4 -mt-5 -mb-24"
        )}
      >
        <CustomerSiteMapRoot enabled={allowed} />
      </div>
    </AppShell>
  );
}
