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
        "rounded-card border border-surface-border bg-surface-card p-5",
        className
      )}
    >
      {title && (
        <h2 className="apple-heading mb-3 text-caption font-semibold">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
