import type { AttendanceHistoryEntry, AttendancePunch } from "@/lib/types";

import {
  calculateWorkMinutes,
  formatBreakPeriods,
  getFirstPunchTime,
  getLastPunchTime,
} from "./format";
import { deriveAttendanceState, workDateJST } from "./state";

export type AttendanceMonthDayRow = {
  workDate: string;
  clockIn: string | null;
  breaks: string;
  clockOut: string | null;
  isWorking: boolean;
  workMinutes: number;
  hasClockIn: boolean;
  hasClockOut: boolean;
};

function groupByWorkDate(
  entries: AttendanceHistoryEntry[]
): Map<string, AttendancePunch[]> {
  const groups = new Map<string, AttendancePunch[]>();
  for (const entry of entries) {
    const list = groups.get(entry.workDate) ?? [];
    list.push(entry);
    groups.set(entry.workDate, list);
  }
  return groups;
}

export function aggregateAttendanceMonthRows(
  entries: AttendanceHistoryEntry[],
  today = workDateJST()
): AttendanceMonthDayRow[] {
  const groups = groupByWorkDate(entries);
  const rows: AttendanceMonthDayRow[] = [];

  for (const [workDate, punches] of groups) {
    const sorted = [...punches].sort((a, b) =>
      a.punchedAt.localeCompare(b.punchedAt)
    );
    const state = deriveAttendanceState(sorted);
    const hasClockIn = sorted.some((p) => p.punchType === "clock_in");
    const hasClockOut = sorted.some((p) => p.punchType === "clock_out");
    const isWorking =
      workDate === today && hasClockIn && state !== "finished";

    rows.push({
      workDate,
      clockIn: getFirstPunchTime(sorted, "clock_in"),
      breaks: formatBreakPeriods(sorted),
      clockOut: isWorking ? null : getLastPunchTime(sorted, "clock_out"),
      isWorking,
      workMinutes: calculateWorkMinutes(sorted),
      hasClockIn,
      hasClockOut,
    });
  }

  return rows.sort((a, b) => b.workDate.localeCompare(a.workDate));
}

export function summarizeMonthRows(rows: AttendanceMonthDayRow[]): {
  dayCount: number;
  totalMinutes: number;
} {
  const dayCount = rows.filter((row) => row.clockIn).length;
  const totalMinutes = rows.reduce((sum, row) => sum + row.workMinutes, 0);
  return { dayCount, totalMinutes };
}
