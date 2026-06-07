"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  title: string;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
};

export function WizardLoadState({ title, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <AppShell title={title}>
        <p className="text-center text-apple-glyph">読み込み中…</p>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title={title}>
        <Card title="読み込みエラー">
          <p className="text-caption text-red-600">{error}</p>
          {onRetry && (
            <Button className="mt-4" onClick={onRetry}>
              再読み込み
            </Button>
          )}
        </Card>
      </AppShell>
    );
  }

  return null;
}
