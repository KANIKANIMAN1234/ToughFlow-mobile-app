export type UserRole = "admin" | "office" | "manager" | "field";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

export interface MasterBase {
  id: string;
  tenantId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface DailyReportWorkType extends MasterBase {}

export interface DailyReportVehicle extends MasterBase {
  code: string;
  label: string;
  noteLabel?: string;
}

export interface DailyReportMaterial extends MasterBase {
  unit?: string;
  inputType: "number" | "text" | "checkbox";
}

export interface SiteSurveyWorkType extends MasterBase {}

export interface SiteSurveyTool extends MasterBase {}

export interface ExpenseCategory extends MasterBase {}

export interface Project {
  id: string;
  name: string;
  customerName: string;
  siteAddress: string;
  deliveryCompany: string;
  deliveryAddress: string;
  billingClient: string;
  clientContact?: string;
  status: "active" | "completed";
}

export interface MachineRow {
  name: string;
  maker: string;
  model: string;
  qty: number;
  unitNo?: string;
}

export interface VehicleSelection {
  vehicleId: string;
  note?: string;
}

export interface MaterialValue {
  materialId: string;
  value: string | number | boolean;
}

export interface DailyReportCosts {
  labor?: number | null;
  toll?: number | null;
  consumables?: number | null;
  expense?: number | null;
  total?: number | null;
  vehicle?: number | null;
  gasoline?: number | null;
  externalLabor?: number | null;
  outsource?: number | null;
}

export interface DailyReportContent {
  billingClient: string;
  clientContact?: string;
  workDateStart: string;
  workDateEnd?: string | null;
  pickup: { address?: string; company?: string };
  delivery: { address: string; company: string };
  workTypeIds: string[];
  machines: MachineRow[];
  vehicles: VehicleSelection[];
  materials: MaterialValue[];
  remarks?: string;
  siteWorkTime: { from?: string; to?: string };
  tollRoads: (number | null)[];
  siteInspection: boolean;
  roadPermit: boolean;
  guidesCount?: number | null;
  costs: DailyReportCosts;
  reporterName?: string;
  photos: string[];
}

export type DailyReportStatus = "draft" | "submitted";

export interface DailyReport {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  status: DailyReportStatus;
  content: DailyReportContent;
  createdAt: string;
  submittedAt?: string;
}

export interface Expense {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  expenseDate: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  inputMethod: "manual" | "ocr" | "ocr_edited";
  memo?: string;
  createdAt: string;
}

export interface SiteSurveyToolCheck {
  toolId: string | null;
  name: string;
  load: boolean;
  use: boolean;
}

export interface SiteSurveyPhotoEntry {
  url: string;
  caption: string;
}

export interface SiteSurveyContent {
  customerName: string;
  hasEstimate: boolean;
  surveyDate: string;
  siteAddress: string;
  surveyorName: string;
  contactPhone?: string;
  customerContact?: string;
  workDatetime: string;
  workTypeId: string;
  machineModel: string;
  entrance: {
    heightMm?: number;
    widthMm?: number;
    eaves?: string;
    slope?: string;
    step?: string;
  };
  plannedVehicles: string[];
  unload: {
    floor?: string;
    blueSheetM?: number;
    floorProtection?: string;
  };
  facility: {
    overheadCrane?: string;
    forklift?: string;
    other?: string;
  };
  internalMove?: string;
  requiredToolsNote?: string;
  plannedWorkers?: number;
  workSteps: string[];
  precautions: string[];
  tools: SiteSurveyToolCheck[];
  photos: {
    mapCarryIn?: string;
    siteLayout?: string;
    /** PDF 3ページ目の代表写真（entries の先頭 URL と同期） */
    sitePhoto?: string;
    /** 現場調査写真：左=画像、右=説明 を縦に並べる */
    sitePhotoEntries?: SiteSurveyPhotoEntry[];
  };
}

export type SiteSurveyStatus = "draft" | "published";

export interface SiteSurvey {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  status: SiteSurveyStatus;
  content: SiteSurveyContent;
  createdAt: string;
  publishedAt?: string;
}

export interface DailyReportMasters {
  workTypes: DailyReportWorkType[];
  vehicles: DailyReportVehicle[];
  materials: DailyReportMaterial[];
}

export interface SiteSurveyMasters {
  workTypes: SiteSurveyWorkType[];
  tools: SiteSurveyTool[];
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles?: UserRole[];
}
