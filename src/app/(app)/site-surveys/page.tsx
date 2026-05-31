"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import type { SiteSurvey } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function SiteSurveysPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [surveys, setSurveys] = useState<SiteSurvey[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ surveys: SiteSurvey[] }>(`/api/site-surveys?userId=${user.id}`)
      .then((d) => setSurveys(d.surveys));
  }, [user]);

  if (loading || !user) return null;

  return (
    <AppShell title="現地調査一覧">
      <Link href="/site-surveys/new">
        <Button fullWidth className="mb-4">
          ＋ 新規入力
        </Button>
      </Link>
      <div className="space-y-3">
        {surveys.map((s) => (
          <Card key={s.id}>
            <p className="font-semibold">{s.content.customerName}</p>
            <p className="text-xs text-slate-500">
              {formatDate(s.content.surveyDate)} · {s.projectName}
            </p>
            <p className="mt-1 text-xs text-brand-600">{s.status}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
