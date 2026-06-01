"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** A4 縦 1枚分の高さ（96dpi 換算の目安） */
export const A4_PAGE_MIN_H = "min-h-[1123px]";

export function PaperPage({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section
      className={cn(
        "relative border border-slate-800 bg-white shadow-sm",
        A4_PAGE_MIN_H,
        className
      )}
    >
      {label && (
        <span className="absolute right-2 top-1 text-[10px] text-slate-400">
          {label}
        </span>
      )}
      {children}
    </section>
  );
}

export function Cell({
  children,
  className,
  colSpan,
  rowSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={cn(
        "border border-slate-800 p-1 align-top text-xs text-slate-900",
        className
      )}
    >
      {children}
    </td>
  );
}

export function InlineInput({
  value,
  onChange,
  type = "text",
  className,
  placeholder,
  compact,
  inputMode,
}: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  /** 表内の短い数値など。w-full を使わず横並び可能にする */
  compact?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "border-0 border-b border-slate-400 bg-transparent px-0.5 py-0 text-xs outline-none focus:border-brand-500",
        compact
          ? "inline-block w-8 shrink-0 text-center leading-tight"
          : "block w-full min-w-0",
        className
      )}
    />
  );
}

export function YesNo({
  value,
  onChange,
  labels = ["無", "有"],
}: {
  value?: string;
  onChange: (v: string) => void;
  labels?: [string, string];
}) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <label className="inline-flex items-center gap-0.5">
        <input
          type="radio"
          className="h-3 w-3"
          checked={value === labels[0]}
          onChange={() => onChange(labels[0])}
        />
        {labels[0]}
      </label>
      <label className="inline-flex items-center gap-0.5">
        <input
          type="radio"
          className="h-3 w-3"
          checked={value === labels[1]}
          onChange={() => onChange(labels[1])}
        />
        {labels[1]}
      </label>
    </span>
  );
}
