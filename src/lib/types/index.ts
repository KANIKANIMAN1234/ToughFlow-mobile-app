export type UserRole = "admin" | "office" | "manager" | "field" | "partner";

export type AccessLevel = "allow" | "conditional" | "deny";

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
  salesAmount?: number;
  status: "active" | "completed";
}

export interface CustomerOption {
  id: string;
  name: string;
}

export interface AssignableUser {
  id: string;
  name: string;
  role: UserRole;
}

export type ProjectAssignmentRole = "main" | "sub";

export type ProjectAssignmentInput = {
  userId: string;
  assignmentRole: ProjectAssignmentRole;
};

export type CreateProjectInput = {
  name: string;
  customerId: string;
  workStartDate?: string;
  assignments: ProjectAssignmentInput[];
};

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

export type AttendancePunchType =
  | "clock_in"
  | "break_out"
  | "break_in"
  | "clock_out";

export type AttendanceState = "idle" | "working" | "on_break" | "finished";

export interface AttendancePunch {
  id: string;
  userId: string;
  punchType: AttendancePunchType;
  punchedAt: string;
  workDate: string;
  source: "pc" | "mobile";
  note?: string;
}

export interface AttendanceStatus {
  state: AttendanceState;
  workDate: string;
  punches: AttendancePunch[];
  allowedTypes: AttendancePunchType[];
}

export interface AttendanceHistoryEntry extends AttendancePunch {
  userName: string;
}

export type AttendanceStaffOption = {
  id: string;
  name: string;
};

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
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

export type ShareNotifyMethod = "default" | "email" | "line" | "both";

export type StaffType =
  | "unclassified"
  | "full_time"
  | "contract"
  | "temporary"
  | "part_time";

export type PrescribedWorkDaysType = "unset" | "week" | "year";

export interface StaffProfile {
  lastName: string;
  firstName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  staffCode?: string;
  staffType: StaffType;
  hourlyWage?: number | null;
  prescribedWorkDaysType?: PrescribedWorkDaysType;
  prescribedWorkHours: number;
  prescribedWorkMinutes: number;
  transportationAllowance?: number | null;
  joinDate?: string;
  remark1?: string;
  remark2?: string;
  remark3?: string;
  tags?: string;
}

export interface TenantUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  shareNotifyMethod?: ShareNotifyMethod;
  lineUserId?: string;
}

export interface TenantStaff extends TenantUser, StaffProfile {}

export type EmploymentScheduledCalcType =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "shift";

export type EmploymentOvertimeCalcType = string;

export interface EmploymentWorkRuleInput {
  groupKey: string;
  staffType: StaffType | null;
  scheduledCalcType: EmploymentScheduledCalcType;
  scheduledLimitHours: number;
  scheduledLimitMinutes: number;
  overtimeRatePercent: number;
  overtimeCalcType: EmploymentOvertimeCalcType;
  overtimeDayThresholdHours: number;
  overtimeDayThresholdMinutes: number;
  overtimeWeekThresholdHours: number;
  overtimeWeekThresholdMinutes: number;
  deemedOvertimeEnabled: boolean;
  deemedOvertimeHours: number;
  deemedOvertimeMinutes: number;
  excludeStatutoryHolidays: boolean;
  lateNightRatePercent: number;
  lateNightStartHour: number;
  lateNightStartMinute: number;
  lateNightEndHour: number;
  lateNightEndMinute: number;
  includeEarlyMorningInLateNight: boolean;
}

export interface EmploymentWorkRule extends EmploymentWorkRuleInput {
  id: string;
  tenantId: string;
  updatedAt: string;
}

export type Agreement36Version = "new" | "old";

export interface Agreement36GlobalInput {
  isEnabled: boolean;
  startMonth: number;
  startDay: number;
  agreementVersion: Agreement36Version;
}

export interface Agreement36FiscalInput {
  fiscalYear: number;
  specialDailyHours: number;
  specialMonthlyHours: number;
  specialExceedCount: number;
  specialYearlyHours: number;
  alertDailyEnabled: boolean;
  alertDailyHours: number;
  alertWeeklyEnabled: boolean;
  alertWeeklyHours: number;
  alertMonthlyEnabled: boolean;
  alertMonthlyHours: number;
  alertAvg26Enabled: boolean;
  alertAvg26Hours: number;
  alertYearlyEnabled: boolean;
  alertYearlyHours: number;
  alertExceedCountEnabled: boolean;
  alertExceedCount: number;
  notifyEmployee: boolean;
  notifyAdmin: boolean;
  notifyCustom: boolean;
  notifyCustomUserId: string | null;
  notifyCustomEmail: string;
  notifyEmployeeLine: boolean;
  notifyAdminLine: boolean;
  notifyCustomLine: boolean;
  notifyCustomLineUserId: string | null;
}

export interface Agreement36Global extends Agreement36GlobalInput {
  id: string;
  tenantId: string;
  updatedAt: string;
}

export interface Agreement36Fiscal extends Agreement36FiscalInput {
  id: string;
  tenantId: string;
  updatedAt: string;
}
