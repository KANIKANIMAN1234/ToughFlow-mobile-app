"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import type { AttendanceMonthDayRow } from "@/lib/attendance/history";
import { summarizeMonthRows } from "@/lib/attendance/history";
import {
  calculateWorkMinutes,
  formatMonthDayWithWeekday,
  formatWorkDurationShort,
  isSaturday,
} from "@/lib/attendance/format";
import { workDateJST } from "@/lib/attendance/state";
import type { AttendancePunch, AttendanceStaffOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type HistoryResponse = {
  rows: AttendanceMonthDayRow[];
  canViewAll: boolean;
  staff: AttendanceStaffOption[];
  userId: string;
};

type Props = {
  currentUserId: string;
  refreshToken?: number;
  todayPunches?: AttendancePunch[];
};

function currentYearMonth() {
  const today = workDateJST();
  const [year, month] = today.split("-").map(Number);
  return { year, month };
}

export function AttendanceMonthlyList({
  currentUserId,
  refreshToken = 0,
  todayPunches,
}: Props) {
  const initial = currentYearMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setLiveTick((value) => value + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelectedUserId(currentUserId);
  }, [currentUserId]);

  const query = `/api/attendance/history?year=${year}&month=${month}&userId=${selectedUserId}&_=${refreshToken}`;
  const { data, isLoading } = useApi<HistoryResponse>(query);

  const rows = useMemo(() => {
    const base = data?.rows ?? [];
    if (!todayPunches?.length || selectedUserId !== currentUserId) return base;
    const today = workDateJST();
    return base.map((row) =>
      row.isWorking && row.workDate === today
        ? { ...row, workMinutes: calculateWorkMinutes(todayPunches) }
        : row
    );
  }, [data?.rows, todayPunches, selectedUserId, currentUserId, liveTick]);

  const summary = useMemo(() => summarizeMonthRows(rows), [rows]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-surface-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
          <h2 className="text-body font-semibold text-apple-text">月間勤怠一覧</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {data?.canViewAll && data.staff.length > 0 && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="focus-apple rounded-xl border border-surface-border bg-white px-3 py-2 text-caption"
            >
              {data.staff.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="focus-apple rounded-lg p-1.5 text-apple-glyph hover:bg-slate-100"
              aria-label="前の月"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[6.5rem] text-center text-caption font-medium text-apple-text">
              {year}年{month}月
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="focus-apple rounded-lg p-1.5 text-apple-glyph hover:bg-slate-100"
              aria-label="次の月"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="p-5">
          <CardListSkeleton />
        </div>
      ) : rows.length === 0 ? (
        <p className="p-5 text-caption text-apple-glyph">
          この月の勤怠データはありません
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[36rem] text-left text-caption">
            <thead className="sticky top-0 bg-slate-50 text-apple-glyph">
              <tr className="border-b border-surface-border">
                <th className="px-4 py-3 font-medium">日付</th>
                <th className="px-4 py-3 font-medium">出勤</th>
                <th className="px-4 py-3 font-medium">休憩</th>
                <th className="px-4 py-3 font-medium">退勤</th>
                <th className="px-4 py-3 font-medium">実労働時間</th>
                <th className="px-4 py-3 font-medium">位置（出勤/退勤）</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.workDate}
                  className="border-b border-surface-border/70"
                >
                  <td
                    className={cn(
                      "px-4 py-3 font-medium",
                      isSaturday(row.workDate)
                        ? "text-sky-600"
                        : "text-apple-text"
                    )}
                  >
                    {formatMonthDayWithWeekday(row.workDate)}
                  </td>
                  <td className="px-4 py-3 font-mono text-apple-text">
                    {row.clockIn ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-apple-glyph">{row.breaks}</td>
                  <td className="px-4 py-3 font-mono">
                    {row.isWorking ? (
                      <span className="font-medium text-rose-600">勤務中</span>
                    ) : (
                      <span className="text-apple-text">
                        {row.clockOut ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-apple-text">
                    {row.workMinutes > 0
                      ? formatWorkDurationShort(row.workMinutes)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className={cn(
                          "h-4 w-4",
                          row.hasClockIn
                            ? "text-emerald-500"
                            : "text-slate-300"
                        )}
                        aria-label="出勤位置"
                      />
                      <MapPin
                        className={cn(
                          "h-4 w-4",
                          row.hasClockOut
                            ? "text-rose-500"
                            : "text-slate-300"
                        )}
                        aria-label="退勤位置"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-medium text-apple-text">
                <td className="px-4 py-3" colSpan={4}>
                  {summary.dayCount}日 合計
                </td>
                <td className="px-4 py-3 font-mono" colSpan={2}>
                  {formatWorkDurationShort(summary.totalMinutes)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
