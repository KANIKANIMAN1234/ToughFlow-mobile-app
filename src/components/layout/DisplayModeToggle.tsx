"use client";

import { Smartphone, Tablet } from "lucide-react";
import { useDisplayMode, type DisplayMode } from "@/contexts/DisplayModeContext";
import { cn } from "@/lib/utils";

export function DisplayModeToggle({ compact }: { compact?: boolean }) {
  const { mode, setMode } = useDisplayMode();

  return (
    <div
      className="flex rounded-pill border border-surface-border bg-apple-section p-0.5"
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
            "flex items-center gap-1 rounded-pill px-2.5 py-1 text-nav-link font-normal transition-colors focus-apple",
            mode === value
              ? "bg-white text-apple-text shadow-sm"
              : "text-apple-glyph hover:text-apple-text"
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
