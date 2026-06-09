"use client";

import { AppShell } from "@/components/layout/AppShell";
import { AttendancePunchPanel } from "@/components/attendance/AttendancePunchPanel";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import type { AttendancePunchType, AttendanceStatus } from "@/lib/types";

export default function AttendancePage() {
  const { user, authLoading } = useAuthGuard();
  const { isTablet } = useDisplayMode();
  const { data, isLoading, mutate } = useApi<{ status: AttendanceStatus }>(
    user ? "/api/attendance" : null
  );

  async function handlePunch(punchType: AttendancePunchType) {
    const res = await fetch("/api/attendance", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ punchType }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error ?? "打刻に失敗しました");
    }
    await mutate({ status: body.status }, false);
  }

  if (authLoading || !user) {
    return (
      <AppShell title="出退勤">
        <CardListSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="出退勤">
      <div className={isTablet ? "mx-auto max-w-[480px]" : undefined}>
        {isLoading && !data ? (
          <CardListSkeleton />
        ) : (
          <AttendancePunchPanel
            status={data?.status}
            isLoading={isLoading}
            onPunch={handlePunch}
            layout="grid"
          />
        )}
      </div>
    </AppShell>
  );
}
