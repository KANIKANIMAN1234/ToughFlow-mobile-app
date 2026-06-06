import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-apple-section", className)}
      aria-hidden
    />
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-card border border-surface-border bg-white p-4"
        >
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="mt-2 h-3 w-2/5" />
          <Skeleton className="mt-2 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-card border border-surface-border bg-white p-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <Skeleton className="mt-2 h-4 w-3/5" />
      </div>
      <div className="rounded-card border border-surface-border bg-white p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-4 h-4 w-full" />
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <>
      <div className="rounded-card border border-surface-border bg-white p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-full" />
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-card border border-surface-border bg-white p-4"
          >
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
