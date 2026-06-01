"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IpadWizardLayoutProps = {
  title: string;
  steps: string[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: ReactNode;
  footer: ReactNode;
};

export function IpadWizardLayout({
  title,
  steps,
  currentStep,
  onStepChange,
  children,
  footer,
}: IpadWizardLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      <nav
        className="shrink-0 border-b border-surface-border bg-white p-4 lg:w-52 lg:border-b-0 lg:border-r"
        aria-label="ステップ"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </p>
        <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {steps.map((label, index) => {
            const stepNum = index + 1;
            const active = stepNum === currentStep;
            const done = stepNum < currentStep;
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => onStepChange(stepNum)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm whitespace-nowrap transition-colors",
                    active && "bg-brand-50 font-semibold text-brand-700",
                    done && !active && "text-slate-600 hover:bg-slate-50",
                    !active && !done && "text-slate-400 hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      active && "bg-brand-600 text-white",
                      done && !active && "bg-slate-200 text-slate-600",
                      !active && !done && "bg-slate-100 text-slate-400"
                    )}
                  >
                    {stepNum}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 p-6">{children}</div>
        <div className="sticky bottom-0 border-t border-surface-border bg-white px-6 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}
