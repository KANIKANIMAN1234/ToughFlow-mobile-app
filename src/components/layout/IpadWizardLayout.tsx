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
        <p className="mb-3 text-nav-link font-normal uppercase tracking-wide text-apple-glyph">
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
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-caption whitespace-nowrap transition-colors focus-apple",
                    active && "bg-brand-50 font-normal text-brand-700",
                    done && !active && "text-apple-glyph hover:bg-apple-section",
                    !active && !done && "text-apple-glyph/60 hover:bg-apple-section"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-nav-link font-normal",
                      active && "bg-brand-600 text-white",
                      done && !active && "bg-apple-border text-apple-glyph",
                      !active && !done && "bg-apple-section text-apple-glyph/60"
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
