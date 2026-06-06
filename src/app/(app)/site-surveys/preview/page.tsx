"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import {
  clearPreviewState,
  loadPreviewState,
  type SiteSurveyPreviewState,
} from "@/lib/site-survey/preview-state";
import { formatDate } from "@/lib/utils";

export default function SiteSurveyPreviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [state, setState] = useState<SiteSurveyPreviewState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loaded = loadPreviewState();
    if (!loaded) {
      router.replace("/site-surveys/new");
      return;
    }
    setState(loaded);
  }, [router]);

  async function handleSubmit(publish: boolean) {
    if (!user || !state) return;
    setSubmitting(true);
    try {
      await api.post("/api/site-surveys", {
        projectId: state.projectId,
        projectName: state.projectName,
        userId: user.id,
        userName: user.name,
        content: state.content,
        status: publish ? "published" : "draft",
      });
      clearPreviewState();
      router.push("/site-surveys");
    } finally {
      setSubmitting(false);
    }
  }

  if (!state) {
    return (
      <AppShell title="プレビュー">
        <p className="p-6 text-center text-apple-glyph">読み込み中…</p>
      </AppShell>
    );
  }

  const c = state.content;

  return (
    <AppShell title="現地調査プレビュー">
      <Card title="案件">
        <p className="text-body text-apple-text">{state.projectName}</p>
      </Card>

      <Card title="基本情報" className="mt-4">
        <dl className="space-y-2 text-caption">
          <div>
            <dt className="text-apple-glyph">顧客名</dt>
            <dd>{c.customerName}</dd>
          </div>
          <div>
            <dt className="text-apple-glyph">調査日</dt>
            <dd>{formatDate(c.surveyDate)}</dd>
          </div>
          <div>
            <dt className="text-apple-glyph">現場住所</dt>
            <dd>{c.siteAddress}</dd>
          </div>
          <div>
            <dt className="text-apple-glyph">調査担当</dt>
            <dd>{c.surveyorName}</dd>
          </div>
        </dl>
      </Card>

      <Card title="作業予定" className="mt-4">
        <dl className="space-y-2 text-caption">
          <div>
            <dt className="text-apple-glyph">作業日時</dt>
            <dd>{formatDate(c.workDatetime)}</dd>
          </div>
          <div>
            <dt className="text-apple-glyph">機種</dt>
            <dd>{c.machineModel || "—"}</dd>
          </div>
          <div>
            <dt className="text-apple-glyph">予定車両</dt>
            <dd>{c.plannedVehicles.join("、") || "—"}</dd>
          </div>
          <div>
            <dt className="text-apple-glyph">予定人数</dt>
            <dd>{c.plannedWorkers ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card title="作業手順・注意" className="mt-4">
        <p className="mb-2 text-xs font-medium text-apple-glyph">手順</p>
        <ul className="list-inside list-disc text-caption">
          {c.workSteps.filter(Boolean).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <p className="mb-2 mt-4 text-xs font-medium text-apple-glyph">注意事項</p>
        <ul className="list-inside list-disc text-caption">
          {c.precautions.filter(Boolean).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Card>

      <Card title="道具チェック" className="mt-4">
        <ul className="space-y-1 text-caption">
          {c.tools.map((t) => (
            <li key={t.toolId}>
              {t.name}（積: {t.load ? "○" : "—"} / 使: {t.use ? "○" : "—"}）
            </li>
          ))}
        </ul>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-mobile gap-2 border-t bg-white p-4">
        <Button
          variant="secondary"
          disabled={submitting}
          onClick={() => router.back()}
        >
          戻る
        </Button>
        <Button
          variant="secondary"
          disabled={submitting}
          onClick={() => handleSubmit(false)}
        >
          下書き
        </Button>
        <Button
          fullWidth
          disabled={submitting}
          onClick={() => handleSubmit(true)}
        >
          {submitting ? "保存中…" : "確定"}
        </Button>
      </div>
    </AppShell>
  );
}
