import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-surface-border bg-surface-card p-4 shadow-sm",
        className
      )}
    >
      {title && (
        <h2 className="mb-3 text-sm font-bold text-slate-800">{title}</h2>
      )}
      {children}
    </section>
  );
}
