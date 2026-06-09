import {
  deriveAttendanceState,
  getAllowedPunchTypes,
  validatePunchTransition,
  workDateJST,
} from "@/lib/attendance/state";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDbClient } from "@/lib/supabase/context";
import { formatDbError } from "@/lib/db/errors";
import { resolveTenantByCodeForLine } from "@/lib/line/tenant";
import {
  DEFAULT_PERMISSION_MATRIX,
  FALLBACK_PERMISSIONS,
} from "@/lib/permissions/defaults";
import type {
  AccessLevel,
  AttendanceHistoryEntry,
  AttendancePunch,
  AttendancePunchType,
  AttendanceStaffOption,
  AttendanceStatus,
  CompanyInfo,
  DailyReport,
  DailyReportContent,
  DailyReportMaterial,
  DailyReportMasters,
  DailyReportVehicle,
  DailyReportWorkType,
  Expense,
  ExpenseCategory,
  AssignableUser,
  CreateProjectInput,
  CustomerOption,
  Project,
  SiteSurvey,
  SiteSurveyContent,
  SiteSurveyMasters,
  SiteSurveyTool,
  SiteSurveyWorkType,
  User,
  UserRole,
} from "@/lib/types";

type DbCustomer = { name: string; address: string | null } | null;

type DbProjectRow = {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  m_customer: DbCustomer | DbCustomer[];
};

function unwrapJoin<T>(value: T | T[] | null): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapProject(row: DbProjectRow): Project {
  const customer = unwrapJoin(row.m_customer);
  const customerName = customer?.name ?? "";
  const address = customer?.address ?? "";
  return {
    id: row.id,
    name: row.name,
    customerName,
    siteAddress: address,
    deliveryAddress: address,
    deliveryCompany: customerName,
    billingClient: customerName,
    clientContact: "",
    status: row.status === "closed" ? "completed" : "active",
  };
}

function mapMasterBase(row: {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export async function loginUser(
  tenantCode: string,
  userName: string,
  role?: UserRole
): Promise<User> {
  const supabase = createAdminClient();
  const code = tenantCode.trim().toUpperCase();

  const { data: tenant, error: tenantError } = await supabase
    .from("m_tenant")
    .select("id, name, status")
    .eq("tenant_code", code)
    .maybeSingle();

  if (tenantError) throw new Error(formatDbError(tenantError.message));
  if (!tenant) throw new Error("会社コードが正しくありません");
  if (tenant.status !== "active") throw new Error("このテナントは利用できません");

  let query = supabase
    .from("m_user")
    .select("id, name, role, tenant_id, is_active")
    .eq("tenant_id", tenant.id)
    .eq("name", userName.trim())
    .eq("is_active", true);

  if (role) query = query.eq("role", role);

  const { data: dbUser, error: userError } = await query.maybeSingle();
  if (userError) throw new Error(formatDbError(userError.message));
  if (!dbUser) throw new Error("ユーザーが見つかりません");

  return {
    id: dbUser.id,
    name: dbUser.name,
    role: dbUser.role as UserRole,
    tenantId: tenant.id,
    tenantName: tenant.name,
  };
}

function toSessionUser(
  dbUser: { id: string; name: string; role: string },
  tenant: { id: string; name: string }
): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    role: dbUser.role as UserRole,
    tenantId: tenant.id,
    tenantName: tenant.name,
  };
}

/** LINE Login: line_user_id で特定。未登録なら m_user を自動作成（役職は管理者が後から設定） */
export async function loginUserByLineId(
  tenantCode: string,
  lineUserId: string,
  lineDisplayName?: string,
  options?: { defaultRole?: User["role"] }
): Promise<User> {
  const supabase = createAdminClient();
  const tenant = await resolveTenantByCodeForLine(tenantCode);

  const { data: existing, error: existingError } = await supabase
    .from("m_user")
    .select("id, name, role, tenant_id, is_active, line_user_id")
    .eq("tenant_id", tenant.id)
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (existingError) throw new Error(formatDbError(existingError.message));

  if (existing?.is_active) {
    return toSessionUser(existing, tenant);
  }

  if (existing && !existing.is_active) {
    const name = lineDisplayName?.trim() || existing.name;
    const { data: reactivated, error: reactivateError } = await supabase
      .from("m_user")
      .update({ is_active: true, name })
      .eq("id", existing.id)
      .select("id, name, role, tenant_id, is_active")
      .single();
    if (reactivateError) throw new Error(formatDbError(reactivateError.message));
    return toSessionUser(reactivated, tenant);
  }

  const name = lineDisplayName?.trim() || "ユーザー";
  const defaultRole = options?.defaultRole ?? "field";
  const { data: created, error: createError } = await supabase
    .from("m_user")
    .insert({
      tenant_id: tenant.id,
      line_user_id: lineUserId,
      name,
      role: defaultRole,
      is_active: true,
    })
    .select("id, name, role, tenant_id, is_active")
    .single();

  if (createError) {
    if (createError.message.includes("duplicate") || createError.code === "23505") {
      const { data: retry, error: retryError } = await supabase
        .from("m_user")
        .select("id, name, role, tenant_id, is_active")
        .eq("tenant_id", tenant.id)
        .eq("line_user_id", lineUserId)
        .eq("is_active", true)
        .maybeSingle();
      if (retryError) throw new Error(formatDbError(retryError.message));
      if (retry) return toSessionUser(retry, tenant);
    }
    throw new Error(formatDbError(createError.message));
  }

  return toSessionUser(created, tenant);
}

export async function listProjects(
  tenantId: string,
  options?: { userId?: string; role?: UserRole }
): Promise<Project[]> {
  const supabase = getDbClient();
  let assignedIds: string[] | null = null;

  if (options?.role === "field" && options.userId) {
    const { data: assignments, error: assignError } = await supabase
      .from("t_project_assignment")
      .select("project_id")
      .eq("tenant_id", tenantId)
      .eq("user_id", options.userId);
    if (assignError) throw new Error(assignError.message);
    assignedIds = (assignments ?? []).map((r) => r.project_id as string);
    if (assignedIds.length === 0) return [];
  }

  let query = supabase
    .from("m_project")
    .select("id, tenant_id, name, status, m_customer(name, address)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("name");

  if (assignedIds) query = query.in("id", assignedIds);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as DbProjectRow[]).map(mapProject);
}

export async function listMapMarkers(tenantId: string) {
  const supabase = createAdminClient();

  const { data: customers, error: customerError } = await supabase
    .from("m_customer")
    .select("id, name, address, lat, lng")
    .eq("tenant_id", tenantId)
    .order("name");

  if (customerError) throw new Error(customerError.message);

  const { data: projects, error: projectError } = await supabase
    .from("m_project")
    .select("id, name, status, customer_id")
    .eq("tenant_id", tenantId)
    .neq("status", "draft");

  if (projectError) throw new Error(projectError.message);

  const projectsByCustomer = new Map<
    string,
    { id: string; name: string; status: string }[]
  >();
  for (const project of projects ?? []) {
    if (!project.customer_id) continue;
    const list = projectsByCustomer.get(project.customer_id) ?? [];
    list.push({
      id: project.id,
      name: project.name,
      status: project.status,
    });
    projectsByCustomer.set(project.customer_id, list);
  }

  return (customers ?? [])
    .filter((row) => Boolean(row.address?.trim()))
    .map((row) => ({
      id: row.id,
      customerName: row.name,
      address: row.address!.trim(),
      lat: row.lat != null ? Number(row.lat) : null,
      lng: row.lng != null ? Number(row.lng) : null,
      projects: projectsByCustomer.get(row.id) ?? [],
    }));
}

export async function getDailyReportMasters(
  tenantId: string
): Promise<DailyReportMasters> {
  const supabase = createAdminClient();

  const [workTypes, vehicles, materials] = await Promise.all([
    supabase
      .from("m_daily_report_work_type")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("m_daily_report_vehicle")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("m_daily_report_material")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (workTypes.error) throw new Error(workTypes.error.message);
  if (vehicles.error) throw new Error(vehicles.error.message);
  if (materials.error) throw new Error(materials.error.message);

  return {
    workTypes: (workTypes.data ?? []).map(
      (r) => mapMasterBase(r) as DailyReportWorkType
    ),
    vehicles: (vehicles.data ?? []).map((r) => ({
      ...mapMasterBase({ ...r, name: r.label }),
      code: r.code,
      label: r.label,
      noteLabel: r.note_label ?? undefined,
    })) as DailyReportVehicle[],
    materials: (materials.data ?? []).map((r) => ({
      ...mapMasterBase(r),
      unit: r.unit ?? undefined,
      inputType: r.input_type as DailyReportMaterial["inputType"],
    })) as DailyReportMaterial[],
  };
}

export async function getSiteSurveyMasters(
  tenantId: string
): Promise<SiteSurveyMasters> {
  const supabase = createAdminClient();

  const [workTypes, tools] = await Promise.all([
    supabase
      .from("m_site_survey_work_type")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("m_site_survey_tool")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (workTypes.error) throw new Error(workTypes.error.message);
  if (tools.error) throw new Error(tools.error.message);

  return {
    workTypes: (workTypes.data ?? []).map(
      (r) => mapMasterBase(r) as SiteSurveyWorkType
    ),
    tools: (tools.data ?? []).map((r) => mapMasterBase(r) as SiteSurveyTool),
  };
}

export async function listExpenseCategories(
  tenantId: string
): Promise<ExpenseCategory[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("m_expense_category")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapMasterBase(r) as ExpenseCategory);
}

export async function getCompanyInfo(tenantId: string): Promise<CompanyInfo> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("m_tenant")
    .select("name, company_info")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const info = (data?.company_info ?? {}) as Record<string, unknown>;
  return {
    name: data?.name ?? (info.name as string) ?? "",
    address: (info.address as string) ?? "",
    phone: (info.phone as string) ?? "",
  };
}

export async function updateDailyReportPdfRef(
  tenantId: string,
  reportId: string,
  pdfRef: string
): Promise<void> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from("t_daily_report")
    .update({ report_pdf_drive_id: pdfRef })
    .eq("tenant_id", tenantId)
    .eq("id", reportId);

  if (error) throw new Error(error.message);
}

const DEFAULT_SUBFOLDERS = [
  "経費",
  "日報",
  "現地調査",
  "報告書",
  "見積",
  "作業完了報告",
  "請求",
];

export type FolderSettingsForDrive = {
  driveRootFolderId: string;
  projectNamePattern: string;
  subfolderNames: string[];
};

export type ProjectDriveInfo = {
  projectId: string;
  projectName: string;
  projectDriveFolderId: string | null;
  workStartDate: string | null;
  customerId: string | null;
  customerName: string;
  customerDriveFolderId: string | null;
};

export async function getFolderSettingsForDrive(
  tenantId: string
): Promise<FolderSettingsForDrive> {
  const supabase = getDbClient();
  const [tenantRes, templateRes] = await Promise.all([
    supabase
      .from("m_tenant")
      .select("drive_root_folder_id")
      .eq("id", tenantId)
      .maybeSingle(),
    supabase
      .from("m_folder_template")
      .select("subfolder_names, project_name_pattern")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  if (tenantRes.error) throw new Error(tenantRes.error.message);
  if (templateRes.error) throw new Error(templateRes.error.message);

  const subfolders = templateRes.data?.subfolder_names;
  return {
    driveRootFolderId: tenantRes.data?.drive_root_folder_id ?? "",
    projectNamePattern:
      templateRes.data?.project_name_pattern ?? "{date}_{name}",
    subfolderNames: Array.isArray(subfolders)
      ? (subfolders as string[])
      : DEFAULT_SUBFOLDERS,
  };
}

export async function getProjectDriveInfo(
  tenantId: string,
  projectId: string
): Promise<ProjectDriveInfo | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("m_project")
    .select(
      "id, name, drive_folder_id, work_start_date, customer_id, m_customer(id, name, drive_folder_id)"
    )
    .eq("tenant_id", tenantId)
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const customer = unwrapJoin(
    data.m_customer as
      | { id: string; name: string; drive_folder_id: string | null }
      | { id: string; name: string; drive_folder_id: string | null }[]
      | null
  );

  return {
    projectId: data.id,
    projectName: data.name,
    projectDriveFolderId: data.drive_folder_id,
    workStartDate: data.work_start_date,
    customerId: data.customer_id,
    customerName: customer?.name ?? "未分類",
    customerDriveFolderId: customer?.drive_folder_id ?? null,
  };
}

export async function updateCustomerDriveFolderId(
  tenantId: string,
  customerId: string,
  driveFolderId: string
): Promise<void> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from("m_customer")
    .update({ drive_folder_id: driveFolderId })
    .eq("tenant_id", tenantId)
    .eq("id", customerId);

  if (error) throw new Error(error.message);
}

export async function updateProjectDriveFolderId(
  tenantId: string,
  projectId: string,
  driveFolderId: string
): Promise<void> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from("m_project")
    .update({ drive_folder_id: driveFolderId })
    .eq("tenant_id", tenantId)
    .eq("id", projectId);

  if (error) throw new Error(error.message);
}

export async function updateExpenseDriveFileId(
  tenantId: string,
  expenseId: string,
  driveFileId: string
): Promise<void> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from("t_expense")
    .update({ drive_file_id: driveFileId })
    .eq("tenant_id", tenantId)
    .eq("id", expenseId);

  if (error) throw new Error(error.message);
}

async function getProjectName(projectId: string): Promise<string> {
  const supabase = getDbClient();
  const { data } = await supabase
    .from("m_project")
    .select("name")
    .eq("id", projectId)
    .maybeSingle();
  return data?.name ?? "";
}

async function getUserName(userId: string): Promise<string> {
  const supabase = getDbClient();
  const { data } = await supabase
    .from("m_user")
    .select("name")
    .eq("id", userId)
    .maybeSingle();
  return data?.name ?? "";
}

async function getCategoryName(categoryId: string): Promise<string> {
  const supabase = getDbClient();
  const { data } = await supabase
    .from("m_expense_category")
    .select("name")
    .eq("id", categoryId)
    .maybeSingle();
  return data?.name ?? "";
}

export async function listDailyReports(
  tenantId: string,
  userId?: string
): Promise<DailyReport[]> {
  const supabase = getDbClient();
  let query = supabase
    .from("t_daily_report")
    .select(
      "id, project_id, user_id, report_date, content, status, created_at, submitted_at, m_project(name), m_user(name)"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const project = unwrapJoin(
      row.m_project as { name: string } | { name: string }[] | null
    );
    const user = unwrapJoin(
      row.m_user as { name: string } | { name: string }[] | null
    );
    return {
      id: row.id,
      projectId: row.project_id,
      projectName: project?.name ?? "",
      userId: row.user_id,
      userName: user?.name ?? "",
      status: row.status as DailyReport["status"],
      content: row.content as DailyReportContent,
      createdAt: row.created_at,
      submittedAt: row.submitted_at ?? undefined,
    };
  });
}

export async function createDailyReport(
  tenantId: string,
  input: {
    projectId: string;
    userId: string;
    content: DailyReportContent;
    status: DailyReport["status"];
  }
): Promise<DailyReport> {
  const supabase = getDbClient();
  const now = new Date().toISOString();
  const submittedAt = input.status === "submitted" ? now : null;

  const { data, error } = await supabase
    .from("t_daily_report")
    .insert({
      tenant_id: tenantId,
      project_id: input.projectId,
      user_id: input.userId,
      report_date: input.content.workDateStart,
      content: input.content,
      status: input.status,
      submitted_at: submittedAt,
    })
    .select("id, project_id, user_id, content, status, created_at, submitted_at")
    .single();

  if (error) throw new Error(error.message);

  const [projectName, userName] = await Promise.all([
    getProjectName(data.project_id),
    getUserName(data.user_id),
  ]);

  return {
    id: data.id,
    projectId: data.project_id,
    projectName,
    userId: data.user_id,
    userName,
    status: data.status as DailyReport["status"],
    content: data.content as DailyReportContent,
    createdAt: data.created_at,
    submittedAt: data.submitted_at ?? undefined,
  };
}

export async function submitExpenseBatch(
  tenantId: string,
  userId: string,
  expenseIds?: string[]
): Promise<number> {
  const supabase = getDbClient();
  let query = supabase
    .from("t_expense")
    .update({ status: "submitted" })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("status", "draft");

  if (expenseIds?.length) query = query.in("id", expenseIds);

  const { data, error } = await query.select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export async function getUserAccessMap(
  tenantId: string,
  userId: string,
  role: UserRole
): Promise<Record<string, AccessLevel>> {
  const supabase = createAdminClient();
  const permissionCodes = Object.keys(DEFAULT_PERMISSION_MATRIX);

  const [{ data: userPerms }, { data: rolePerms }, { data: permDefs }] =
    await Promise.all([
      supabase
        .from("m_user_permission")
        .select("permission_id, access_level, m_permission(code)")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId),
      supabase
        .from("m_role_permission")
        .select("permission_id, access_level, m_permission(code)")
        .eq("tenant_id", tenantId)
        .eq("role", role),
      supabase.from("m_permission").select("id, code"),
    ]);

  const codeById = new Map<string, string>();
  for (const row of permDefs ?? []) {
    codeById.set(row.id as string, row.code as string);
  }
  for (const fb of FALLBACK_PERMISSIONS) {
    codeById.set(fb.id, fb.code);
  }

  const userOverrideByCode = new Map<string, AccessLevel>();
  for (const row of userPerms ?? []) {
    const perm = Array.isArray(row.m_permission)
      ? row.m_permission[0]
      : row.m_permission;
    const code = (perm as { code?: string } | null)?.code;
    if (code) userOverrideByCode.set(code, row.access_level as AccessLevel);
  }

  const roleOverrideByCode = new Map<string, AccessLevel>();
  for (const row of rolePerms ?? []) {
    const perm = Array.isArray(row.m_permission)
      ? row.m_permission[0]
      : row.m_permission;
    const code = (perm as { code?: string } | null)?.code;
    if (code) roleOverrideByCode.set(code, row.access_level as AccessLevel);
  }

  const access: Record<string, AccessLevel> = {};
  for (const code of permissionCodes) {
    if (userOverrideByCode.has(code)) {
      access[code] = userOverrideByCode.get(code)!;
    } else if (roleOverrideByCode.has(code)) {
      access[code] = roleOverrideByCode.get(code)!;
    } else {
      access[code] = DEFAULT_PERMISSION_MATRIX[code]?.[role] ?? "deny";
    }
  }

  return access;
}

export async function getPendingReminders(tenantId: string, userId: string) {
  const supabase = getDbClient();
  const [expensesRes, reportsRes] = await Promise.all([
    supabase
      .from("t_expense")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("status", "draft"),
    supabase
      .from("t_daily_report")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("status", "draft"),
  ]);

  if (expensesRes.error) throw new Error(expensesRes.error.message);
  if (reportsRes.error) throw new Error(reportsRes.error.message);

  return {
    draftExpenses: expensesRes.count ?? 0,
    draftDailyReports: reportsRes.count ?? 0,
  };
}

export async function getDailyReport(
  tenantId: string,
  id: string
): Promise<DailyReport | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("t_daily_report")
    .select(
      "id, project_id, user_id, content, status, created_at, submitted_at, m_project(name), m_user(name)"
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const project = unwrapJoin(
    data.m_project as { name: string } | { name: string }[] | null
  );
  const user = unwrapJoin(
    data.m_user as { name: string } | { name: string }[] | null
  );

  return {
    id: data.id,
    projectId: data.project_id,
    projectName: project?.name ?? "",
    userId: data.user_id,
    userName: user?.name ?? "",
    status: data.status as DailyReport["status"],
    content: data.content as DailyReportContent,
    createdAt: data.created_at,
    submittedAt: data.submitted_at ?? undefined,
  };
}

export async function listExpenses(
  tenantId: string,
  filters?: {
    userId?: string;
    projectId?: string;
    expenseDate?: string;
    status?: Expense["status"];
  }
): Promise<Expense[]> {
  const supabase = getDbClient();
  let query = supabase
    .from("t_expense")
    .select(
      "id, project_id, user_id, amount, category_id, expense_date, status, input_method, created_at, m_project(name), m_user(name), m_expense_category(name)"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.userId) query = query.eq("user_id", filters.userId);
  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  if (filters?.expenseDate) query = query.eq("expense_date", filters.expenseDate);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const project = unwrapJoin(
      row.m_project as { name: string } | { name: string }[] | null
    );
    const user = unwrapJoin(
      row.m_user as { name: string } | { name: string }[] | null
    );
    const category = unwrapJoin(
      row.m_expense_category as { name: string } | { name: string }[] | null
    );
    return {
      id: row.id,
      projectId: row.project_id,
      projectName: project?.name ?? "",
      userId: row.user_id,
      userName: user?.name ?? "",
      amount: Number(row.amount),
      categoryId: row.category_id,
      categoryName: category?.name ?? "",
      expenseDate: row.expense_date,
      status: row.status as Expense["status"],
      inputMethod: row.input_method as Expense["inputMethod"],
      createdAt: row.created_at,
    };
  });
}

export async function createExpense(
  tenantId: string,
  input: Omit<
    Expense,
    "id" | "createdAt" | "projectName" | "userName" | "categoryName"
  >
): Promise<Expense> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("t_expense")
    .insert({
      tenant_id: tenantId,
      project_id: input.projectId,
      user_id: input.userId,
      amount: input.amount,
      category_id: input.categoryId,
      expense_date: input.expenseDate,
      status: input.status,
      input_method: input.inputMethod,
    })
    .select(
      "id, project_id, user_id, amount, category_id, expense_date, status, input_method, created_at"
    )
    .single();

  if (error) throw new Error(error.message);

  const [projectName, userName, categoryName] = await Promise.all([
    getProjectName(data.project_id),
    getUserName(data.user_id),
    getCategoryName(data.category_id),
  ]);

  return {
    id: data.id,
    projectId: data.project_id,
    projectName,
    userId: data.user_id,
    userName,
    amount: Number(data.amount),
    categoryId: data.category_id,
    categoryName,
    expenseDate: data.expense_date,
    status: data.status as Expense["status"],
    inputMethod: data.input_method as Expense["inputMethod"],
    memo: input.memo,
    createdAt: data.created_at,
  };
}

type ChecklistPayload = SiteSurveyContent & {
  _meta?: { status?: SiteSurvey["status"]; publishedAt?: string };
};

function parseSiteSurveyRow(row: {
  id: string;
  project_id: string;
  user_id: string;
  checklist: ChecklistPayload;
  created_at: string;
  m_project: { name: string } | { name: string }[] | null;
  m_user: { name: string } | { name: string }[] | null;
}): SiteSurvey {
  const project = unwrapJoin(row.m_project);
  const user = unwrapJoin(row.m_user);
  const { _meta, ...content } = row.checklist ?? {};
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: project?.name ?? "",
    userId: row.user_id,
    userName: user?.name ?? "",
    status: _meta?.status ?? "draft",
    content: content as SiteSurveyContent,
    createdAt: row.created_at,
    publishedAt: _meta?.publishedAt,
  };
}

export async function listSiteSurveys(
  tenantId: string,
  userId?: string
): Promise<SiteSurvey[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("t_site_survey")
    .select(
      "id, project_id, user_id, checklist, created_at, m_project(name), m_user(name)"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) throw new Error(formatDbError(error.message));

  return (data ?? []).map((row) => parseSiteSurveyRow(row as never));
}

export async function getSiteSurvey(
  tenantId: string,
  id: string
): Promise<SiteSurvey | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("t_site_survey")
    .select(
      "id, project_id, user_id, checklist, created_at, m_project(name), m_user(name)"
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(formatDbError(error.message));
  if (!data) return null;
  return parseSiteSurveyRow(data as never);
}

export async function updateSiteSurveyPdfRef(
  tenantId: string,
  surveyId: string,
  pdfRef: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("t_site_survey")
    .update({ report_pdf_drive_id: pdfRef })
    .eq("tenant_id", tenantId)
    .eq("id", surveyId);

  if (error) throw new Error(error.message);
}

export async function createSiteSurvey(
  tenantId: string,
  input: {
    projectId: string;
    userId: string;
    content: SiteSurveyContent;
    status: SiteSurvey["status"];
    driveFileIds?: string[];
  }
): Promise<SiteSurvey> {
  const supabase = createAdminClient();
  const publishedAt =
    input.status === "published" ? new Date().toISOString() : undefined;
  const checklist: ChecklistPayload = {
    ...input.content,
    _meta: { status: input.status, publishedAt },
  };

  const { data, error } = await supabase
    .from("t_site_survey")
    .insert({
      tenant_id: tenantId,
      project_id: input.projectId,
      user_id: input.userId,
      survey_date: input.content.surveyDate || new Date().toISOString(),
      checklist,
      drive_file_ids: input.driveFileIds ?? [],
      shared_to_partner: input.status === "published",
      shared_at: publishedAt ?? null,
    })
    .select(
      "id, project_id, user_id, checklist, created_at, m_project(name), m_user(name)"
    )
    .single();

  if (error) throw new Error(formatDbError(error.message));

  const survey = parseSiteSurveyRow(data as never);

  if (input.status === "published") {
    try {
      await createDispatchDraftFromSurvey(
        tenantId,
        survey.id,
        input.projectId,
        input.content
      );
    } catch (e) {
      console.error("[site-survey] dispatch draft failed:", e);
    }
  }

  return survey;
}

async function createDispatchDraftFromSurvey(
  tenantId: string,
  surveyId: string,
  projectId: string,
  content: SiteSurveyContent
) {
  const workDate = content.workDatetime?.slice(0, 10);
  if (!workDate) return;

  const today = new Date().toISOString().slice(0, 10);
  if (workDate <= today) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("t_dispatch").insert({
    tenant_id: tenantId,
    dispatch_date: workDate,
    project_id: projectId,
    row_status: "draft",
    content: {
      customerName: content.customerName,
      siteName: content.siteAddress,
      assignee: content.surveyorName,
      vehicles: content.plannedVehicles.join(", "),
      workers: content.plannedWorkers ?? 0,
      source: "site_survey",
      surveyId,
    },
  });

  if (error) throw new Error(error.message);
}

function mapAttendancePunch(row: {
  id: string;
  user_id: string;
  punch_type: string;
  punched_at: string;
  work_date: string;
  source: string;
  note: string | null;
}): AttendancePunch {
  return {
    id: row.id,
    userId: row.user_id,
    punchType: row.punch_type as AttendancePunchType,
    punchedAt: row.punched_at,
    workDate: row.work_date,
    source: row.source as AttendancePunch["source"],
    note: row.note ?? undefined,
  };
}

export async function listAttendancePunches(
  tenantId: string,
  userId: string,
  workDate?: string
): Promise<AttendancePunch[]> {
  const supabase = getDbClient();
  const date = workDate ?? workDateJST();
  const { data, error } = await supabase
    .from("t_attendance_punch")
    .select("id, user_id, punch_type, punched_at, work_date, source, note")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("work_date", date)
    .order("punched_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapAttendancePunch(row as never));
}

export async function getAttendanceStatus(
  tenantId: string,
  userId: string,
  workDate?: string
): Promise<AttendanceStatus> {
  const date = workDate ?? workDateJST();
  const punches = await listAttendancePunches(tenantId, userId, date);
  const state = deriveAttendanceState(punches);
  return {
    state,
    workDate: date,
    punches,
    allowedTypes: getAllowedPunchTypes(state),
  };
}

export async function createAttendancePunch(
  tenantId: string,
  userId: string,
  punchType: AttendancePunchType,
  source: AttendancePunch["source"]
): Promise<AttendanceStatus> {
  const workDate = workDateJST();
  const existing = await listAttendancePunches(tenantId, userId, workDate);
  const validationError = validatePunchTransition(existing, punchType);
  if (validationError) throw new Error(validationError);

  const supabase = getDbClient();
  const { error } = await supabase.from("t_attendance_punch").insert({
    tenant_id: tenantId,
    user_id: userId,
    punch_type: punchType,
    work_date: workDate,
    source,
  });

  if (error) throw new Error(error.message);
  return getAttendanceStatus(tenantId, userId, workDate);
}

export type AttendanceHistoryQuery = {
  userId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
};

export async function listAttendanceHistory(
  tenantId: string,
  query: AttendanceHistoryQuery = {}
): Promise<AttendanceHistoryEntry[]> {
  const supabase = createAdminClient();
  let dbQuery = supabase
    .from("t_attendance_punch")
    .select(
      "id, user_id, punch_type, punched_at, work_date, source, note, m_user(name)"
    )
    .eq("tenant_id", tenantId)
    .order("punched_at", { ascending: false })
    .limit(query.limit ?? 500);

  if (query.userId) dbQuery = dbQuery.eq("user_id", query.userId);
  if (query.fromDate) dbQuery = dbQuery.gte("work_date", query.fromDate);
  if (query.toDate) dbQuery = dbQuery.lte("work_date", query.toDate);

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const user = unwrapJoin(
      row.m_user as { name: string } | { name: string }[] | null
    );
    return {
      ...mapAttendancePunch(row as never),
      userName: user?.name ?? "",
    };
  });
}

export async function listAttendanceStaffOptions(
  tenantId: string
): Promise<AttendanceStaffOption[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("m_user")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
  }));
}

export async function listCustomerOptions(
  tenantId: string
): Promise<CustomerOption[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("m_customer")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
  }));
}

export async function listAssignableUsers(
  tenantId: string
): Promise<AssignableUser[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("m_user")
    .select("id, name, role")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    role: row.role as UserRole,
  }));
}

export async function createProjectWithAssignments(
  tenantId: string,
  input: CreateProjectInput
): Promise<Project> {
  if (!input.name.trim()) throw new Error("案件名を入力してください");
  if (!input.customerId) throw new Error("顧客を選択してください");
  if (!input.assignments.length) {
    throw new Error("担当者を1名以上選択してください");
  }

  const userIds = input.assignments.map((a) => a.userId);
  if (userIds.some((id) => !id)) {
    throw new Error("担当者を選択してください");
  }
  if (new Set(userIds).size !== userIds.length) {
    throw new Error("同じ担当者が重複しています");
  }
  if (!input.assignments.some((a) => a.assignmentRole === "main")) {
    throw new Error("メイン担当者を1名以上指定してください");
  }

  const supabase = createAdminClient();
  const workStartDate =
    input.workStartDate?.trim() || new Date().toISOString().slice(0, 10);

  const { data: project, error } = await supabase
    .from("m_project")
    .insert({
      tenant_id: tenantId,
      customer_id: input.customerId,
      name: input.name.trim(),
      status: "active",
      work_start_date: workStartDate,
    })
    .select("id, tenant_id, name, status, m_customer(name, address)")
    .single();

  if (error) throw new Error(formatDbError(error.message));

  const assignments = input.assignments.map((assignment) => ({
    tenant_id: tenantId,
    project_id: project.id as string,
    user_id: assignment.userId,
    assignment_role: assignment.assignmentRole,
  }));

  const { error: assignError } = await supabase
    .from("t_project_assignment")
    .insert(assignments);

  if (assignError) {
    await supabase.from("m_project").delete().eq("id", project.id);
    throw new Error(formatDbError(assignError.message));
  }

  return mapProject(project as DbProjectRow);
}
