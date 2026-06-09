"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectRegisterForm } from "@/components/project/ProjectRegisterForm";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePermissions } from "@/hooks/usePermissions";

export default function ProjectRegisterPage() {
  const { user, authLoading } = useAuthGuard();
  const { canAccess, loading: permLoading } = usePermissions();
  const router = useRouter();

  const allowed = canAccess("project_register");

  useEffect(() => {
    if (authLoading || permLoading) return;
    if (user && !allowed) router.replace("/home");
  }, [user, authLoading, permLoading, allowed, router]);

  if (authLoading || permLoading || !user) {
    return (
      <AppShell title="新規案件登録">
        <CardListSkeleton />
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell title="新規案件登録">
        <CardListSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="新規案件登録">
      <ProjectRegisterForm />
    </AppShell>
  );
}
