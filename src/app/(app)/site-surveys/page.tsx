"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { SiteSurvey } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function SiteSurveysPage() {
  const { user, authLoading } = useAuthGuard();
  const { data, isLoading } = useApi<{ surveys: SiteSurvey[] }>(
    user ? `/api/site-surveys?userId=${user.id}` : null
  );

  const surveys = data?.surveys ?? [];

  if (authLoading || !user) {
    return (
      <AppShell title="現地調査一覧">
        <CardListSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="現地調査一覧">
      <Link href="/site-surveys/new">
        <Button fullWidth className="mb-4">
          ＋ 新規入力
        </Button>
      </Link>
      {isLoading && !data ? (
        <CardListSkeleton />
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => (
            <Card key={s.id}>
              <p className="font-normal text-apple-text">
                {s.content.customerName}
              </p>
              <p className="text-nav-link text-apple-glyph">
                {formatDate(s.content.surveyDate)} · {s.projectName}
              </p>
              <p className="mt-1 text-xs text-brand-600">{s.status}</p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
