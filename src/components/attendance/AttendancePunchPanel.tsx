"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getPunchButtonClassName,
  PUNCH_BUTTONS,
  PUNCH_LABELS,
  STATE_LABELS,
} from "@/lib/attendance/labels";
import { cn } from "@/lib/utils";
import type { AttendancePunchType, AttendanceStatus } from "@/lib/types";

type Props = {
  status: AttendanceStatus | undefined;
  isLoading: boolean;
  onPunch: (type: AttendancePunchType) => Promise<void>;
  layout?: "grid" | "compact";
};

export function AttendancePunchPanel({
  status,
  isLoading,
  onPunch,
  layout = "grid",
}: Props) {
  const [submitting, setSubmitting] = useState<AttendancePunchType | null>(null);
  const allowed = new Set(status?.allowedTypes ?? []);

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

  return (
    <div className="space-y-4">
      <Card title="本日の状態">
        <p className="text-body font-medium text-apple-text">
          {status ? STATE_LABELS[status.state] : "読み込み中…"}
        </p>
        {status?.workDate && (
          <p className="mt-1 text-caption text-apple-glyph">
            対象日: {status.workDate}
          </p>
        )}
      </Card>

      <div
        className={cn(
          layout === "grid"
            ? "grid grid-cols-2 gap-3"
            : "flex flex-wrap gap-2"
        )}
      >
        {PUNCH_BUTTONS.map(({ type, label }) => {
          const enabled = allowed.has(type) && !isLoading && submitting === null;
          return (
            <Button
              key={type}
              fullWidth={layout === "grid"}
              variant="ghost"
              disabled={!enabled}
              onClick={() => handlePunch(type)}
              className={cn(
                layout === "grid" && "min-h-[4.5rem] text-lg",
                getPunchButtonClassName(type, enabled),
                !enabled && "cursor-not-allowed opacity-70"
              )}
            >
              {submitting === type ? "打刻中…" : label}
            </Button>
          );
        })}
      </div>

      <Card title="本日の打刻履歴">
        {!status?.punches.length ? (
          <p className="text-caption text-apple-glyph">まだ打刻がありません</p>
        ) : (
          <ul className="space-y-2 text-caption">
            {status.punches.map((p) => (
              <li
                key={p.id}
                className="flex justify-between border-b border-surface-border pb-2 last:border-0"
              >
                <span>{PUNCH_LABELS[p.punchType]}</span>
                <span className="text-apple-glyph">
                  {new Date(p.punchedAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
