"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import { submitSiteSurvey } from "@/lib/site-survey/submit";
import type {
  Project,
  SiteSurveyContent,
  SiteSurveyMasters,
  SiteSurveyToolCheck,
} from "@/lib/types";
import { savePreviewState } from "@/lib/site-survey/preview-state";
import { todayISO } from "@/lib/utils";

export const SITE_SURVEY_STEPS = ["基本", "搬入", "作業", "道具", "写真"] as const;

export function useSiteSurveyWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [masters, setMasters] = useState<SiteSurveyMasters | null>(null);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [mastersError, setMastersError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState<SiteSurveyContent>(() => ({
    customerName: "",
    hasEstimate: true,
    surveyDate: todayISO(),
    siteAddress: "",
    surveyorName: "",
    workDatetime: todayISO(),
    workTypeId: "",
    machineModel: "",
    entrance: {},
    plannedVehicles: [],
    unload: {},
    facility: {},
    workSteps: [""],
    precautions: [""],
    tools: [],
    photos: {
      sitePhotoEntries: [{ url: "", caption: "" }],
    },
  }));

  useEffect(() => {
    let cancelled = false;
    setMastersLoading(true);
    setMastersError(null);

    Promise.all([
      api.get<{ projects: Project[] }>("/api/projects"),
      api.get<SiteSurveyMasters>("/api/masters/site-survey"),
    ])
      .then(([p, m]) => {
        if (cancelled) return;
        setProjects(p.projects);
        setMasters(m);
        const tools: SiteSurveyToolCheck[] = m.tools.map((t) => ({
          toolId: t.id,
          name: t.name,
          load: false,
          use: false,
        }));
        if (p.projects[0]) {
          setProjectId(p.projects[0].id);
          setContent((c) => ({
            ...c,
            customerName: p.projects[0].customerName,
            siteAddress: p.projects[0].siteAddress,
            surveyorName: user?.name ?? "",
            workTypeId: m.workTypes[0]?.id ?? "",
            tools,
          }));
        } else {
          setContent((c) => ({ ...c, tools }));
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setMastersError(
          e instanceof Error ? e.message : "データの読み込みに失敗しました"
        );
      })
      .finally(() => {
        if (!cancelled) setMastersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.name]);

  const selectedProject = projects.find((p) => p.id === projectId);

  function selectProject(id: string) {
    setProjectId(id);
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    setContent((c) => ({
      ...c,
      customerName: proj.customerName,
      siteAddress: proj.siteAddress,
    }));
  }

  async function handleSubmit(publish: boolean) {
    if (!user || !selectedProject) return;
    setSubmitting(true);
    try {
      await submitSiteSurvey({
        projectId: selectedProject.id,
        content,
        status: publish ? "published" : "draft",
      });
      router.push("/site-surveys");
    } finally {
      setSubmitting(false);
    }
  }

  function goToPreview() {
    if (!selectedProject) return;
    savePreviewState({
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      content,
    });
    router.push("/site-surveys/preview");
  }

  return {
    step,
    setStep,
    projects,
    masters,
    mastersLoading,
    mastersError,
    projectId,
    selectProject,
    submitting,
    content,
    setContent,
    selectedProject,
    handleSubmit,
    goToPreview,
  };
}

export type SiteSurveyWizardState = ReturnType<typeof useSiteSurveyWizard>;
