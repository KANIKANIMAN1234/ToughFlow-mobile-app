import type { AttendancePunch, AttendancePunchType, AttendanceState } from "@/lib/types";

import { deriveAttendanceState } from "./state";

const JST = "Asia/Tokyo";
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatWorkDateJa(workDate: string): string {
  const d = new Date(`${workDate}T12:00:00`);
  const weekday = WEEKDAYS[d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${weekday})`;
}

export function formatClockTime(date = new Date()): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatPunchTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function calculateWorkMinutes(punches: AttendancePunch[]): number {
  let total = 0;
  let segmentStart: Date | null = null;
  const state = deriveAttendanceState(punches);

  for (const punch of punches) {
    const at = new Date(punch.punchedAt);
    switch (punch.punchType) {
      case "clock_in":
      case "break_in":
        segmentStart = at;
        break;
      case "break_out":
      case "clock_out":
        if (segmentStart) {
          total += (at.getTime() - segmentStart.getTime()) / 60_000;
          segmentStart = null;
        }
        break;
    }
  }

  if (segmentStart && state !== "finished") {
    total += (Date.now() - segmentStart.getTime()) / 60_000;
  }

  return Math.max(0, Math.floor(total));
}

export function formatWorkDuration(minutes: number): string {
  if (minutes <= 0) return "0分";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分`;
  if (mins === 0) return `${hours}時間`;
  return `${hours}時間${mins}分`;
}

export function getShiftTimeRange(punches: AttendancePunch[]): string | null {
  const clockIn = punches.find((p) => p.punchType === "clock_in");
  const clockOut = [...punches].reverse().find((p) => p.punchType === "clock_out");
  if (!clockIn || !clockOut) return null;
  return `${formatPunchTime(clockIn.punchedAt)}〜${formatPunchTime(clockOut.punchedAt)}`;
}

export function getStatusBadgeText(
  state: AttendanceState,
  punches: AttendancePunch[]
): string {
  const range = getShiftTimeRange(punches);
  switch (state) {
    case "idle":
      return "● 未出勤";
    case "working":
      return "● 勤務中";
    case "on_break":
      return "● 休憩中";
    case "finished":
      return range ? `● 退勤済み (${range})` : "● 退勤済み";
    default:
      return "● 未出勤";
  }
}

export const PUNCH_HISTORY_STYLES: Record<
  AttendancePunchType,
  { row: string; label: string; icon: string }
> = {
  clock_in: {
    row: "bg-emerald-50",
    label: "text-emerald-700",
    icon: "text-emerald-600",
  },
  break_out: {
    row: "bg-amber-50",
    label: "text-amber-800",
    icon: "text-amber-600",
  },
  break_in: {
    row: "bg-sky-50",
    label: "text-sky-800",
    icon: "text-sky-600",
  },
  clock_out: {
    row: "bg-rose-50",
    label: "text-rose-700",
    icon: "text-rose-600",
  },
};
