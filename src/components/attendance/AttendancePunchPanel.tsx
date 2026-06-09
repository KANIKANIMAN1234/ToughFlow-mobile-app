"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Coffee,
  History,
  LogIn,
  LogOut,
  MapPin,
  RotateCcw,
} from "lucide-react";

import {
  calculateWorkMinutes,
  formatClockTime,
  formatPunchTime,
  formatWorkDateJa,
  formatWorkDuration,
  getStatusBadgeText,
  PUNCH_HISTORY_STYLES,
} from "@/lib/attendance/format";
import { PUNCH_LABELS } from "@/lib/attendance/labels";
import { cn } from "@/lib/utils";
import type { AttendancePunchType, AttendanceStatus } from "@/lib/types";

type Props = {
  status: AttendanceStatus | undefined;
  isLoading: boolean;
  onPunch: (type: AttendancePunchType) => Promise<void>;
  layout?: "grid" | "compact";
};

type PunchButtonConfig = {
  type: AttendancePunchType;
  label: string;
  icon: LucideIcon;
  enabled: string;
  disabled: string;
};

const PUNCH_BUTTON_CONFIG: PunchButtonConfig[] = [
  {
    type: "clock_in",
    label: "出勤",
    icon: LogIn,
    enabled: "bg-emerald-400 text-white shadow-sm active:bg-emerald-500",
    disabled: "bg-emerald-100 text-emerald-700",
  },
  {
    type: "break_out",
    label: "休憩",
    icon: Coffee,
    enabled: "bg-amber-300 text-white shadow-sm active:bg-amber-400",
    disabled: "bg-amber-100 text-amber-800",
  },
  {
    type: "break_in",
    label: "戻り",
    icon: RotateCcw,
    enabled: "bg-sky-400 text-white shadow-sm active:bg-sky-500",
    disabled: "bg-sky-100 text-sky-800",
  },
  {
    type: "clock_out",
    label: "退勤",
    icon: LogOut,
    enabled: "bg-rose-400 text-white shadow-sm active:bg-rose-500",
    disabled: "bg-rose-100 text-rose-700",
  },
];

export function AttendancePunchPanel({
  status,
  isLoading,
  onPunch,
  layout = "grid",
}: Props) {
  const [submitting, setSubmitting] = useState<AttendancePunchType | null>(null);
  const [now, setNow] = useState(() => new Date());
  const allowed = new Set(status?.allowedTypes ?? []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePunch = useCallback(
    async (type: AttendancePunchType) => {
      setSubmitting(type);
      try {
        await onPunch(type);
      } finally {
        setSubmitting(null);
      }
    },
    [onPunch]
  );

  const workMinutes = useMemo(
    () => calculateWorkMinutes(status?.punches ?? []),
    [status?.punches, now]
  );

  const history = useMemo(
    () => [...(status?.punches ?? [])].reverse(),
    [status?.punches]
  );

  if (layout === "compact") {
    return (
      <LegacyCompactPanel
        status={status}
        isLoading={isLoading}
        submitting={submitting}
        allowed={allowed}
        onPunch={handlePunch}
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm">
        <p className="text-center text-caption text-apple-glyph">
          {status?.workDate
            ? formatWorkDateJa(status.workDate)
            : formatWorkDateJa(
                new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(
                  now
                )
              )}
        </p>

        <p
          className="mt-3 text-center font-mono text-[2.75rem] font-bold leading-none tracking-tight text-apple-text"
          aria-live="polite"
        >
          {formatClockTime(now)}
        </p>

        <div className="mt-4 flex justify-center">
          <span className="rounded-full bg-slate-100 px-4 py-1.5 text-caption text-apple-glyph">
            {status
              ? getStatusBadgeText(status.state, status.punches)
              : "読み込み中…"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {PUNCH_BUTTON_CONFIG.map(({ type, label, icon: Icon, enabled, disabled }) => {
            const isEnabled =
              allowed.has(type) && !isLoading && submitting === null;
            return (
              <button
                key={type}
                type="button"
                disabled={!isEnabled}
                onClick={() => handlePunch(type)}
                className={cn(
                  "flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl font-medium transition-transform focus-apple",
                  isEnabled ? enabled : disabled,
                  isEnabled && "active:scale-[0.98]",
                  !isEnabled && "cursor-not-allowed opacity-80"
                )}
              >
                <Icon className="h-7 w-7" strokeWidth={1.75} />
                <span className="text-body">
                  {submitting === type ? "打刻中…" : label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-center">
          <p className="text-caption text-apple-glyph">本日の実労働時間</p>
          <p className="mt-1 text-xl font-bold text-apple-text">
            {formatWorkDuration(workMinutes)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
          <h2 className="text-body font-semibold text-apple-text">
            本日の打刻履歴
          </h2>
        </div>

        {!history.length ? (
          <p className="text-caption text-apple-glyph">まだ打刻がありません</p>
        ) : (
          <ul className="space-y-2">
            {history.map((punch) => {
              const styles = PUNCH_HISTORY_STYLES[punch.punchType];
              const Icon =
                punch.punchType === "clock_in"
                  ? LogIn
                  : punch.punchType === "clock_out"
                    ? LogOut
                    : punch.punchType === "break_out"
                      ? Coffee
                      : RotateCcw;

              return (
                <li
                  key={punch.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5",
                    styles.row
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", styles.icon)} />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-body font-semibold text-apple-text">
                      {formatPunchTime(punch.punchedAt)}
                    </p>
                    <p className={cn("text-caption font-medium", styles.label)}>
                      {PUNCH_LABELS[punch.punchType]}
                    </p>
                  </div>
                  <Link
                    href="/map"
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/60 bg-white/70 px-2 py-1 text-[11px] font-medium shadow-sm",
                      styles.label
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    地図で確認
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function LegacyCompactPanel({
  status,
  isLoading,
  submitting,
  allowed,
  onPunch,
}: {
  status: AttendanceStatus | undefined;
  isLoading: boolean;
  submitting: AttendancePunchType | null;
  allowed: Set<AttendancePunchType>;
  onPunch: (type: AttendancePunchType) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PUNCH_BUTTON_CONFIG.map(({ type, label, enabled, disabled }) => {
        const isEnabled = allowed.has(type) && !isLoading && submitting === null;
        return (
          <button
            key={type}
            type="button"
            disabled={!isEnabled}
            onClick={() => onPunch(type)}
            className={cn(
              "rounded-xl px-4 py-2 text-body font-semibold transition-colors focus-apple",
              isEnabled ? enabled : disabled,
              !isEnabled && "cursor-not-allowed"
            )}
          >
            {submitting === type ? "打刻中…" : label}
          </button>
        );
      })}
    </div>
  );
}
