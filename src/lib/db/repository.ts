import { createAdminClient } from "@/lib/supabase/admin";
import { formatDbError } from "@/lib/db/errors";
import { resolveTenantByCodeForLine } from "@/lib/line/tenant";
import {
  DEFAULT_PERMISSION_MATRIX,
  FALLBACK_PERMISSIONS,
} from "@/lib/permissions/defaults";
import type {
  AccessLevel,
  CompanyInfo,
  DailyReport,
  DailyReportContent,
  DailyReportMaterial,
  DailyReportMasters,
  DailyReportVehicle,
  DailyReportWorkType,
  Expense,
  ExpenseCategory,
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
  lineDisplayName?: string
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
  const { data: created, error: createError } = await supabase
    .from("m_user")
    .insert({
      tenant_id: tenant.id,
      line_user_id: lineUserId,
      name,
      role: "field",
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("t_daily_report")
    .update({ report_pdf_drive_id: pdfRef })
    .eq("tenant_id", tenantId)
    .eq("id", reportId);

  if (error) throw new Error(error.message);
}

async function getProjectName(projectId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("m_project")
    .select("name")
    .eq("id", projectId)
    .maybeSingle();
  return data?.name ?? "";
}

async function getUserName(userId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("m_user")
    .select("name")
    .eq("id", userId)
    .maybeSingle();
  return data?.name ?? "";
}

async function getCategoryName(categoryId: string): Promise<string> {
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => parseSiteSurveyRow(row as never));
}

export async function createSiteSurvey(
  tenantId: string,
  input: {
    projectId: string;
    userId: string;
    content: SiteSurveyContent;
    status: SiteSurvey["status"];
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
      shared_to_partner: input.status === "published",
      shared_at: publishedAt ?? null,
    })
    .select("id, project_id, user_id, checklist, created_at")
    .single();

  if (error) throw new Error(error.message);

  const [projectName, userName] = await Promise.all([
    getProjectName(data.project_id),
    getUserName(data.user_id),
  ]);

  const { _meta, ...content } = (data.checklist as ChecklistPayload) ?? {};

  const survey: SiteSurvey = {
    id: data.id,
    projectId: data.project_id,
    projectName,
    userId: data.user_id,
    userName,
    status: _meta?.status ?? input.status,
    content: content as SiteSurveyContent,
    createdAt: data.created_at,
    publishedAt: _meta?.publishedAt,
  };

  if (input.status === "published") {
    await createDispatchDraftFromSurvey(
      tenantId,
      survey.id,
      input.projectId,
      input.content
    );
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
