"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    api.get<{ projects: Project[] }>("/api/projects").then((d) => {
      setProjects(d.projects);
    });
  }, []);

  if (loading || !user) return null;

  return (
    <AppShell title="案件一覧">
      <div className="space-y-3">
        {projects.map((p) => (
          <Card key={p.id}>
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-slate-500">{p.customerName}</p>
            <p className="mt-1 text-xs">{p.siteAddress}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
