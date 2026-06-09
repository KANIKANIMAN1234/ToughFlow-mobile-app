"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AttendanceMonthlyList } from "@/components/attendance/AttendanceMonthlyList";
import { AttendancePunchPanel } from "@/components/attendance/AttendancePunchPanel";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import type { AttendancePunchType, AttendanceStatus } from "@/lib/types";

export default function AttendancePage() {
  const { user, authLoading } = useAuthGuard();
  const { isTablet } = useDisplayMode();
  const [historyRefresh, setHistoryRefresh] = useState(0);
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
    setHistoryRefresh((value) => value + 1);
  }

  if (authLoading || !user) {
    return (
      <AppShell title="出退勤">
        <CardListSkeleton />
      </AppShell>
    );
  }

  const punchPanel = (
    <AttendancePunchPanel
      status={data?.status}
      isLoading={isLoading}
      onPunch={handlePunch}
      layout="grid"
      controlOnly={isTablet}
      badgeVariant={isTablet ? "tablet" : "default"}
    />
  );

  return (
    <AppShell title="出退勤">
      {isLoading && !data ? (
        <CardListSkeleton />
      ) : isTablet ? (
        <div className="flex min-h-0 flex-1 gap-5">
          <div className="w-[22rem] shrink-0">{punchPanel}</div>
          <AttendanceMonthlyList
            currentUserId={user.id}
            refreshToken={historyRefresh}
            todayPunches={data?.status?.punches}
          />
        </div>
      ) : (
        <div>{punchPanel}</div>
      )}
    </AppShell>
  );
}
