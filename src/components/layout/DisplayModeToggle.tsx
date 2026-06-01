"use client";

import { Smartphone, Tablet } from "lucide-react";
import { useDisplayMode, type DisplayMode } from "@/contexts/DisplayModeContext";
import { cn } from "@/lib/utils";

export function DisplayModeToggle({ compact }: { compact?: boolean }) {
  const { mode, setMode } = useDisplayMode();

  return (
    <div
      className="flex rounded-lg border border-surface-border bg-slate-50 p-0.5"
      role="group"
      aria-label="表示モード"
    >
      {(
        [
          { value: "phone" as DisplayMode, label: "スマホ", icon: Smartphone },
          { value: "tablet" as DisplayMode, label: "iPad", icon: Tablet },
        ] as const
      ).map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            mode === value
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
          aria-pressed={mode === value}
        >
          <Icon className="h-3.5 w-3.5" />
          {!compact && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
}
