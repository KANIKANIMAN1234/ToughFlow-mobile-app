"use client";

import { cn } from "@/lib/utils";

/** 固定フッター分の下余白（safe-area 込み） */
export const FIXED_ACTION_BAR_PADDING =
  "pb-[calc(6rem+env(safe-area-inset-bottom,0px))]";

export function FixedActionBarSpacer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(FIXED_ACTION_BAR_PADDING, className)}>{children}</div>;
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
        "fixed bottom-0 left-0 right-0 z-20 mx-auto flex max-w-mobile gap-2 border-t bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
        className
      )}
    >
      {children}
    </div>
  );
}
