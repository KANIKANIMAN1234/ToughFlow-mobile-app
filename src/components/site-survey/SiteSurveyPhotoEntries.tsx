"use client";

import type { SiteSurveyContent } from "@/lib/types";
import {
  getSitePhotoEntries,
  syncSitePhotoEntries,
} from "@/lib/site-survey/photos";
import { VoiceInputTextarea } from "@/components/ui/VoiceInputTextarea";
import { cn } from "@/lib/utils";

type Props = {
  content: SiteSurveyContent;
  setContent: React.Dispatch<React.SetStateAction<SiteSurveyContent>>;
  variant?: "paper" | "card";
};

export function SiteSurveyPhotoEntries({
  content,
  setContent,
  variant = "paper",
}: Props) {
  const entries = getSitePhotoEntries(content.photos);

  function updateEntries(
    updater: (
      list: ReturnType<typeof getSitePhotoEntries>
    ) => ReturnType<typeof getSitePhotoEntries>
  ) {
    setContent((c) => ({
      ...c,
      photos: syncSitePhotoEntries(c.photos, updater(getSitePhotoEntries(c.photos))),
    }));
  }

  function setPhotoFile(index: number, file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateEntries((list) => {
      const next = [...list];
      next[index] = { ...next[index], url };
      return next;
    });
  }

  const isPaper = variant === "paper";

  return (
    <div className={cn(isPaper ? "space-y-2" : "space-y-4")}>
      {entries.map((entry, index) => (
        <div
          key={index}
          className={cn(
            "grid grid-cols-2 gap-2",
            isPaper ? "border border-slate-800 p-2" : "rounded-xl border border-surface-border p-3"
          )}
        >
          <div className="min-w-0">
            <p
              className={cn(
                "mb-1 font-medium",
                isPaper ? "text-[10px] text-slate-600" : "text-xs text-slate-500"
              )}
            >
              写真 {entries.length > 1 ? index + 1 : ""}
            </p>
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center border border-dashed bg-slate-50 text-slate-500",
                isPaper
                  ? "min-h-[100px] border-slate-400 text-[10px]"
                  : "min-h-[120px] rounded-lg border-surface-border text-sm"
              )}
            >
              {entry.url ? "📷 変更" : "📷 撮影 / 選択"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setPhotoFile(index, e.target.files?.[0])}
              />
            </label>
            {entry.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.url}
                alt={`現場調査 ${index + 1}`}
                className={cn(
                  "mt-1 w-full object-contain",
                  isPaper ? "max-h-28" : "max-h-36 rounded-lg"
                )}
              />
            )}
          </div>
          <div className="min-w-0">
            <VoiceInputTextarea
              header={
                <p
                  className={cn(
                    "font-medium",
                    isPaper ? "text-[10px] text-slate-600" : "text-xs text-slate-500"
                  )}
                >
                  説明
                </p>
              }
              value={entry.caption}
              onChange={(v) =>
                updateEntries((list) => {
                  const next = [...list];
                  next[index] = { ...next[index], caption: v };
                  return next;
                })
              }
              placeholder="撮影内容・箇所・注意点など"
              textareaClassName={cn(
                "w-full resize-y rounded-none border border-slate-300 p-2 leading-relaxed",
                isPaper
                  ? "min-h-[100px] text-[11px]"
                  : "min-h-[120px] rounded-lg text-sm"
              )}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        className={cn(
          "text-brand-600 underline",
          isPaper ? "text-xs" : "text-sm"
        )}
        onClick={() =>
          updateEntries((list) => [...list, { url: "", caption: "" }])
        }
      >
        ＋ 写真・説明を追加
      </button>
    </div>
  );
}
