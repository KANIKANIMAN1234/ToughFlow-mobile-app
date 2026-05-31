import { cn } from "@/lib/utils";

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
      {steps.map((label, index) => {
        const step = index + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div
            key={label}
            className={cn(
              "flex min-w-[72px] flex-1 flex-col items-center rounded-lg px-1 py-2 text-center text-[10px] font-medium",
              active && "bg-brand-600 text-white",
              done && !active && "bg-brand-100 text-brand-700",
              !active && !done && "bg-slate-100 text-slate-500"
            )}
          >
            <span>{step}</span>
            <span className="truncate">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
