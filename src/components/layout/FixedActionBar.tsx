"use client";

import { cn } from "@/lib/utils";

export function FixedActionBarSpacer({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-1 flex-col pb-24", className)}>{children}</div>;
}

export function FixedActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-surface-border bg-white/95 px-4 py-3 backdrop-blur",
        "mx-auto flex max-w-mobile gap-2",
        className
      )}
    >
      {children}
    </div>
  );
}
