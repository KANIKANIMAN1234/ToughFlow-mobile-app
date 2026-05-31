import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label;
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <textarea
        id={inputId}
        className={cn(
          "min-h-[120px] w-full rounded-xl border border-surface-border bg-white px-3 py-3 text-base text-slate-900 outline-none ring-brand-500 focus:ring-2",
          className
        )}
        {...props}
      />
    </label>
  );
}
