"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePermissions } from "@/hooks/usePermissions";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const { user, authLoading } = useAuthGuard();
  const { canAccess } = usePermissions();
  const { data, isLoading } = useApi<{ projects: Project[] }>(
    user ? "/api/projects" : null
  );

  const projects = data?.projects ?? [];
  const canRegister = canAccess("project_register");

  if (authLoading || !user) {
    return (
      <AppShell title="案件一覧">
        <CardListSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="案件一覧">
      {canRegister && (
        <div className="mb-4">
          <Link href="/projects/new">
            <Button fullWidth>新規案件登録</Button>
          </Link>
        </div>
      )}
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
