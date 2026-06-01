"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import type {
  DailyReportContent,
  DailyReportMasters,
  Expense,
  MachineRow,
  MaterialValue,
  Project,
  VehicleSelection,
} from "@/lib/types";
import { calcDailyReportTotalCosts } from "@/lib/daily-report/costs";
import {
  aggregateExpensesToCosts,
  mergeReimbursementIntoCosts,
} from "@/lib/daily-report/expense-sync";
import { todayISO } from "@/lib/utils";

export const DAILY_REPORT_STEPS = [
  "基本",
  "作業",
  "車両",
  "資材",
  "備考",
  "時間",
] as const;

function emptyMachine(): MachineRow {
  return { name: "", maker: "", model: "", qty: 1 };
}

export function useDailyReportWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [masters, setMasters] = useState<DailyReportMasters | null>(null);
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState<DailyReportContent>(() => ({
    billingClient: "",
    clientContact: "",
    workDateStart: todayISO(),
    pickup: {},
    delivery: { address: "", company: "" },
    workTypeId: "",
    machines: [emptyMachine()],
    vehicles: [],
    materials: [],
    remarks: "",
    siteWorkTime: {},
    tollRoads: [null, null],
    siteInspection: false,
    roadPermit: false,
    costs: { toll: null, gasoline: null },
    reporterName: user?.name ?? "",
    photos: [],
  }));

  useEffect(() => {
    Promise.all([
      api.get<{ projects: Project[] }>("/api/projects"),
      api.get<DailyReportMasters>("/api/masters/daily-report"),
    ]).then(([p, m]) => {
      setProjects(p.projects);
      setMasters(m);
      if (p.projects[0]) {
        setProjectId(p.projects[0].id);
        const proj = p.projects[0];
        setContent((c) => ({
          ...c,
          billingClient: proj.billingClient,
          clientContact: proj.clientContact ?? "",
          delivery: {
            address: proj.deliveryAddress,
            company: proj.deliveryCompany,
          },
          workTypeId: m.workTypes[0]?.id ?? "",
        }));
      }
    });
  }, []);

  /** 立替精算（同日・同案件）→ 高速代/ガソリン代/消耗品/経費へ自動反映 */
  useEffect(() => {
    if (!user || !projectId) return;

    const workDate = content.workDateStart;
    let cancelled = false;

    api
      .get<{ expenses: Expense[] }>(
        `/api/expenses?userId=${encodeURIComponent(user.id)}&projectId=${encodeURIComponent(projectId)}&expenseDate=${encodeURIComponent(workDate)}`
      )
      .then(({ expenses }) => {
        if (cancelled) return;
        const reimbursement = aggregateExpensesToCosts(expenses);
        setContent((c) => {
          if (c.workDateStart !== workDate) return c;
          return {
            ...c,
            costs: mergeReimbursementIntoCosts(c.costs, reimbursement),
          };
        });
      })
      .catch(() => {
        /* デモ環境：取得失敗時は手入力のまま */
      });

    return () => {
      cancelled = true;
    };
  }, [user, projectId, content.workDateStart]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );

  const vehicleMap = useMemo(() => {
    const map = new Map<string, VehicleSelection>();
    content.vehicles.forEach((v) => map.set(v.vehicleId, v));
    return map;
  }, [content.vehicles]);

  function selectProject(id: string) {
    setProjectId(id);
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    setContent((c) => ({
      ...c,
      billingClient: proj.billingClient,
      clientContact: proj.clientContact ?? "",
      delivery: {
        address: proj.deliveryAddress,
        company: proj.deliveryCompany,
      },
    }));
  }

  function toggleVehicle(vehicleId: string) {
    setContent((c) => {
      const exists = c.vehicles.find((v) => v.vehicleId === vehicleId);
      if (exists) {
        return {
          ...c,
          vehicles: c.vehicles.filter((v) => v.vehicleId !== vehicleId),
        };
      }
      return { ...c, vehicles: [...c.vehicles, { vehicleId, note: "" }] };
    });
  }

  function setVehicleNote(vehicleId: string, note: string) {
    setContent((c) => ({
      ...c,
      vehicles: c.vehicles.map((v) =>
        v.vehicleId === vehicleId ? { ...v, note } : v
      ),
    }));
  }

  function setMaterialValue(materialId: string, value: MaterialValue["value"]) {
    setContent((c) => {
      const rest = c.materials.filter((m) => m.materialId !== materialId);
      const empty =
        value === "" ||
        value === false ||
        value === null ||
        value === undefined;
      if (empty) return { ...c, materials: rest };
      return { ...c, materials: [...rest, { materialId, value }] };
    });
  }

  function getMaterialValue(materialId: string) {
    return content.materials.find((m) => m.materialId === materialId)?.value;
  }

  function addMachineRow() {
    setContent((c) => ({
      ...c,
      machines: [...c.machines, emptyMachine()],
    }));
  }

  async function handleSubmit() {
    if (!user || !selectedProject) return;
    setSubmitting(true);
    try {
      await api.post("/api/daily-reports", {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        userId: user.id,
        userName: user.name,
        content: {
          ...content,
          reporterName: user.name,
          costs: {
            ...content.costs,
            total: calcDailyReportTotalCosts(content.costs),
          },
        },
        status: "submitted",
      });
      router.push("/daily-reports");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    step,
    setStep,
    projects,
    masters,
    projectId,
    selectProject,
    submitting,
    content,
    setContent,
    selectedProject,
    vehicleMap,
    toggleVehicle,
    setVehicleNote,
    setMaterialValue,
    getMaterialValue,
    addMachineRow,
    handleSubmit,
    emptyMachine,
  };
}

export type DailyReportWizardState = ReturnType<typeof useDailyReportWizard>;
