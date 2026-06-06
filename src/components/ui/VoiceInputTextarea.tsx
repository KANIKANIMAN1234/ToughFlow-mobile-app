"use client";

import { Mic, Square } from "lucide-react";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { cn } from "@/lib/utils";

type VoiceInputTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  header?: ReactNode;
  textareaClassName?: string;
};

function appendTranscript(current: string, spoken: string) {
  const addition = spoken.trim();
  if (!addition) return current;
  if (!current.trim()) return addition;
  return `${current.replace(/\n$/, "")}\n${addition}`;
}

export function VoiceInputTextarea({
  value,
  onChange,
  label,
  header,
  className,
  textareaClassName,
  placeholder,
  ...props
}: VoiceInputTextareaProps) {
  const { listening, supported, toggle } = useSpeechInput({
    onFinalTranscript: (text) => onChange(appendTranscript(value, text)),
  });

  const headerRow = header ?? (
    label ? <span className="text-caption font-normal text-apple-text">{label}</span> : null
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      {(headerRow || supported) && (
        <div className="flex items-center justify-between gap-2">
          {headerRow ? <div className="min-w-0 flex-1">{headerRow}</div> : <span />}
          {supported ? (
            <button
              type="button"
              onClick={toggle}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium focus-apple",
                listening
                  ? "bg-red-50 text-red-600"
                  : "bg-brand-50 text-brand-600"
              )}
              aria-label={listening ? "音声入力を停止" : "音声入力を開始"}
            >
              {listening ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  停止
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" />
                  音声入力
                </>
              )}
            </button>
          ) : (
            <span className="text-[10px] text-apple-glyph">音声非対応</span>
          )}
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "focus-apple w-full rounded-xl border border-surface-border bg-white px-3 py-3 text-body text-apple-text outline-none",
          textareaClassName
        )}
        {...props}
      />
      {listening && (
        <p className="text-[10px] text-brand-600">音声を認識中…話し終わったら「停止」を押してください</p>
      )}
    </div>
  );
}
