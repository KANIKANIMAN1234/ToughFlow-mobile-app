"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const { user, authLoading } = useAuthGuard();
  const { data, isLoading } = useApi<{ projects: Project[] }>(
    user ? "/api/projects" : null
  );

  const projects = data?.projects ?? [];

  if (authLoading || !user) {
    return (
      <AppShell title="案件一覧">
        <CardListSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="案件一覧">
      {isLoading && !data ? (
        <CardListSkeleton />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Card key={p.id}>
              <p className="font-normal text-apple-text">{p.name}</p>
              <p className="text-nav-link text-apple-glyph">{p.customerName}</p>
              <p className="mt-1 text-xs">{p.siteAddress}</p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
