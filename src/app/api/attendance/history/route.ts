import { NextRequest, NextResponse } from "next/server";

import { aggregateAttendanceMonthRows } from "@/lib/attendance/history";
import {
  listAttendanceHistory,
  listAttendanceStaffOptions,
} from "@/lib/db/repository";
import { isAccessGranted } from "@/lib/permissions/access";
import { withAnyPermission } from "@/lib/permissions/check";

function monthRange(year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    fromDate: `${year}-${mm}-01`,
    toDate: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

export async function GET(request: NextRequest) {
  return withAnyPermission(
    request,
    ["attendance_register", "attendance_view_all"],
    async ({ session, accessMap }) => {
      const canViewAll = isAccessGranted(
        accessMap.attendance_view_all ?? "deny"
      );
      const year = Number(request.nextUrl.searchParams.get("year"));
      const month = Number(request.nextUrl.searchParams.get("month"));
      const requestedUserId =
        request.nextUrl.searchParams.get("userId") ?? undefined;

      const userId = canViewAll
        ? requestedUserId || session.id
        : session.id;

      const range =
        year > 0 && month >= 1 && month <= 12
          ? monthRange(year, month)
          : {};

      try {
        const [entries, staff] = await Promise.all([
          listAttendanceHistory(session.tenantId, {
            userId,
            ...range,
          }),
          canViewAll
            ? listAttendanceStaffOptions(session.tenantId)
            : Promise.resolve([]),
        ]);

        return NextResponse.json({
          rows: aggregateAttendanceMonthRows(entries),
          canViewAll,
          staff,
          userId,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "取得に失敗しました";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  );
}
