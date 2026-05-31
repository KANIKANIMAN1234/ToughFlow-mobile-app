import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label;
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-surface-border bg-white px-3 py-3 text-base text-slate-900 outline-none ring-brand-500 focus:ring-2",
          className
        )}
        {...props}
      />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
