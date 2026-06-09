import {
  AGREEMENT_36_GLOBAL_FISCAL_YEAR,
  DEFAULT_AGREEMENT_36_FISCAL,
  DEFAULT_AGREEMENT_36_GLOBAL,
} from "@/lib/employment/agreement-36-defaults";
import {
  DEFAULT_EMPLOYMENT_WORK_RULE,
  fromTotalMinutes,
  toTotalMinutes,
} from "@/lib/employment/work-rule-defaults";
import { buildStaffName } from "@/lib/staff/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDbClient } from "@/lib/supabase/context";
import type {
  Agreement36Fiscal,
  Agreement36Global,
  EmploymentWorkRule,
  PrescribedWorkDaysType,
  ShareNotifyMethod,
  StaffType,
  TenantStaff,
  User,
  UserRole,
} from "@/lib/types";

export async function listActiveTenantIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("m_tenant")
    .select("id")
    .eq("status", "active");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.id as string);
}

export async function getTenantAdminUser(
  tenantId: string
): Promise<User | null> {
  const supabase = createAdminClient();
  const { data: tenant, error: tenantError } = await supabase
    .from("m_tenant")
    .select("id, name")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantError) throw new Error(tenantError.message);
  if (!tenant) return null;

  const { data: user, error: userError } = await supabase
    .from("m_user")
    .select("id, name, role, tenant_id")
    .eq("tenant_id", tenantId)
    .eq("role", "admin")
    .eq("is_active", true)
    .order("name")
    .limit(1)
    .maybeSingle();

  if (userError) throw new Error(userError.message);
  if (!user) return null;

  return {
    id: user.id as string,
    name: user.name as string,
    role: user.role as UserRole,
    tenantId: user.tenant_id as string,
    tenantName: tenant.name as string,
  };
}

const STAFF_USER_COLUMNS =
  "id, name, last_name, first_name, role, email, share_notify_method, line_user_id, phone, birth_date, staff_code, staff_type, hourly_wage, prescribed_work_days_type, prescribed_work_minutes, transportation_allowance, join_date, remark1, remark2, remark3, tags";

function toPrescribedWorkParts(minutes: number | null | undefined) {
  if (minutes == null || minutes <= 0) return { hours: 0, minutes: 0 };
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

function mapStaffRow(row: Record<string, unknown>): TenantStaff {
  const prescribed = toPrescribedWorkParts(
    row.prescribed_work_minutes as number | null | undefined
  );
  const lastName = (row.last_name as string | null) ?? "";
  const firstName = (row.first_name as string | null) ?? "";
  return {
    id: row.id as string,
    name: (row.name as string) ?? buildStaffName(lastName, firstName),
    lastName,
    firstName,
    role: row.role as UserRole,
    email: (row.email as string | null) ?? undefined,
    shareNotifyMethod: row.share_notify_method as ShareNotifyMethod,
    lineUserId: (row.line_user_id as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
    birthDate: (row.birth_date as string | null) ?? undefined,
    staffCode: (row.staff_code as string | null) ?? undefined,
    staffType: ((row.staff_type as string | null) ?? "unclassified") as StaffType,
    hourlyWage: (row.hourly_wage as number | null) ?? null,
    prescribedWorkDaysType:
      ((row.prescribed_work_days_type as string | null) ??
        "unset") as PrescribedWorkDaysType,
    prescribedWorkHours: prescribed.hours,
    prescribedWorkMinutes: prescribed.minutes,
    transportationAllowance:
      (row.transportation_allowance as number | null) ?? null,
    joinDate: (row.join_date as string | null) ?? undefined,
    remark1: (row.remark1 as string | null) ?? undefined,
    remark2: (row.remark2 as string | null) ?? undefined,
    remark3: (row.remark3 as string | null) ?? undefined,
    tags: (row.tags as string | null) ?? undefined,
  };
}

export async function listTenantStaff(
  tenantId: string
): Promise<TenantStaff[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("m_user")
    .select(STAFF_USER_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapStaffRow(row as Record<string, unknown>));
}

function mapEmploymentWorkRuleRow(
  row: Record<string, unknown>
): EmploymentWorkRule {
  const scheduled = fromTotalMinutes(row.scheduled_limit_minutes as number);
  const overtimeDay = fromTotalMinutes(
    row.overtime_day_threshold_minutes as number
  );
  const overtimeWeek = fromTotalMinutes(
    row.overtime_week_threshold_minutes as number
  );
  const deemed = fromTotalMinutes(row.deemed_overtime_minutes as number);
  const lateStart = fromTotalMinutes(row.late_night_start_minutes as number);
  const lateEnd = fromTotalMinutes(row.late_night_end_minutes as number);

  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    groupKey: (row.group_key as string) ?? "",
    staffType: (row.staff_type as StaffType | null) ?? null,
    scheduledCalcType: row.scheduled_calc_type as EmploymentWorkRule["scheduledCalcType"],
    scheduledLimitHours: scheduled.hours,
    scheduledLimitMinutes: scheduled.minutes,
    overtimeRatePercent: row.overtime_rate_percent as number,
    overtimeCalcType: row.overtime_calc_type as EmploymentWorkRule["overtimeCalcType"],
    overtimeDayThresholdHours: overtimeDay.hours,
    overtimeDayThresholdMinutes: overtimeDay.minutes,
    overtimeWeekThresholdHours: overtimeWeek.hours,
    overtimeWeekThresholdMinutes: overtimeWeek.minutes,
    deemedOvertimeEnabled: row.deemed_overtime_enabled as boolean,
    deemedOvertimeHours: deemed.hours,
    deemedOvertimeMinutes: deemed.minutes,
    excludeStatutoryHolidays: row.exclude_statutory_holidays as boolean,
    lateNightRatePercent: row.late_night_rate_percent as number,
    lateNightStartHour: lateStart.hours,
    lateNightStartMinute: lateStart.minutes,
    lateNightEndHour: lateEnd.hours,
    lateNightEndMinute: lateEnd.minutes,
    includeEarlyMorningInLateNight:
      row.include_early_morning_in_late_night as boolean,
    updatedAt: row.updated_at as string,
  };
}

function buildEmploymentWorkRuleDbPayload() {
  return {
    group_key: DEFAULT_EMPLOYMENT_WORK_RULE.groupKey ?? "",
    staff_type: DEFAULT_EMPLOYMENT_WORK_RULE.staffType,
    scheduled_calc_type: DEFAULT_EMPLOYMENT_WORK_RULE.scheduledCalcType,
    scheduled_limit_minutes: toTotalMinutes(
      DEFAULT_EMPLOYMENT_WORK_RULE.scheduledLimitHours,
      DEFAULT_EMPLOYMENT_WORK_RULE.scheduledLimitMinutes
    ),
    overtime_rate_percent: DEFAULT_EMPLOYMENT_WORK_RULE.overtimeRatePercent,
    overtime_calc_type: DEFAULT_EMPLOYMENT_WORK_RULE.overtimeCalcType,
    overtime_day_threshold_minutes: toTotalMinutes(
      DEFAULT_EMPLOYMENT_WORK_RULE.overtimeDayThresholdHours,
      DEFAULT_EMPLOYMENT_WORK_RULE.overtimeDayThresholdMinutes
    ),
    overtime_week_threshold_minutes: toTotalMinutes(
      DEFAULT_EMPLOYMENT_WORK_RULE.overtimeWeekThresholdHours,
      DEFAULT_EMPLOYMENT_WORK_RULE.overtimeWeekThresholdMinutes
    ),
    deemed_overtime_enabled: DEFAULT_EMPLOYMENT_WORK_RULE.deemedOvertimeEnabled,
    deemed_overtime_minutes: toTotalMinutes(
      DEFAULT_EMPLOYMENT_WORK_RULE.deemedOvertimeHours,
      DEFAULT_EMPLOYMENT_WORK_RULE.deemedOvertimeMinutes
    ),
    exclude_statutory_holidays:
      DEFAULT_EMPLOYMENT_WORK_RULE.excludeStatutoryHolidays,
    late_night_rate_percent: DEFAULT_EMPLOYMENT_WORK_RULE.lateNightRatePercent,
    late_night_start_minutes: toTotalMinutes(
      DEFAULT_EMPLOYMENT_WORK_RULE.lateNightStartHour,
      DEFAULT_EMPLOYMENT_WORK_RULE.lateNightStartMinute
    ),
    late_night_end_minutes: toTotalMinutes(
      DEFAULT_EMPLOYMENT_WORK_RULE.lateNightEndHour,
      DEFAULT_EMPLOYMENT_WORK_RULE.lateNightEndMinute
    ),
    include_early_morning_in_late_night:
      DEFAULT_EMPLOYMENT_WORK_RULE.includeEarlyMorningInLateNight,
  };
}

async function ensureDefaultEmploymentWorkRule(
  tenantId: string
): Promise<void> {
  const supabase = getDbClient();
  const { count, error } = await supabase
    .from("m_employment_work_rule")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;

  const { error: insertError } = await supabase
    .from("m_employment_work_rule")
    .insert({
      tenant_id: tenantId,
      ...buildEmploymentWorkRuleDbPayload(),
    });

  if (insertError) throw new Error(insertError.message);
}

export async function listEmploymentWorkRules(
  tenantId: string
): Promise<EmploymentWorkRule[]> {
  await ensureDefaultEmploymentWorkRule(tenantId);
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("m_employment_work_rule")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("group_key")
    .order("staff_type", { ascending: true, nullsFirst: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapEmploymentWorkRuleRow(row as Record<string, unknown>)
  );
}

function mapAgreement36GlobalRow(
  row: Record<string, unknown>
): Agreement36Global {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    isEnabled: row.is_enabled as boolean,
    startMonth: row.start_month as number,
    startDay: row.start_day as number,
    agreementVersion: row.agreement_version as Agreement36Global["agreementVersion"],
    updatedAt: row.updated_at as string,
  };
}

function mapAgreement36FiscalRow(
  row: Record<string, unknown>
): Agreement36Fiscal {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    fiscalYear: row.fiscal_year as number,
    specialDailyHours: row.special_daily_hours as number,
    specialMonthlyHours: row.special_monthly_hours as number,
    specialExceedCount: row.special_exceed_count as number,
    specialYearlyHours: row.special_yearly_hours as number,
    alertDailyEnabled: row.alert_daily_enabled as boolean,
    alertDailyHours: row.alert_daily_hours as number,
    alertWeeklyEnabled: row.alert_weekly_enabled as boolean,
    alertWeeklyHours: row.alert_weekly_hours as number,
    alertMonthlyEnabled: row.alert_monthly_enabled as boolean,
    alertMonthlyHours: row.alert_monthly_hours as number,
    alertAvg26Enabled: row.alert_avg_2_6_enabled as boolean,
    alertAvg26Hours: row.alert_avg_2_6_hours as number,
    alertYearlyEnabled: row.alert_yearly_enabled as boolean,
    alertYearlyHours: row.alert_yearly_hours as number,
    alertExceedCountEnabled: row.alert_exceed_count_enabled as boolean,
    alertExceedCount: row.alert_exceed_count as number,
    notifyEmployee: row.notify_employee as boolean,
    notifyAdmin: row.notify_admin as boolean,
    notifyCustom: row.notify_custom as boolean,
    notifyCustomUserId: (row.notify_custom_user_id as string | null) ?? null,
    notifyCustomEmail: (row.notify_custom_email as string | null) ?? "",
    notifyEmployeeLine: (row.notify_employee_line as boolean | undefined) ?? false,
    notifyAdminLine: (row.notify_admin_line as boolean | undefined) ?? false,
    notifyCustomLine: (row.notify_custom_line as boolean | undefined) ?? false,
    notifyCustomLineUserId:
      (row.notify_custom_line_user_id as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

function buildAgreement36GlobalPayload() {
  return {
    fiscal_year: AGREEMENT_36_GLOBAL_FISCAL_YEAR,
    group_key: "",
    staff_type: null,
    is_enabled: DEFAULT_AGREEMENT_36_GLOBAL.isEnabled,
    start_month: DEFAULT_AGREEMENT_36_GLOBAL.startMonth,
    start_day: DEFAULT_AGREEMENT_36_GLOBAL.startDay,
    agreement_version: DEFAULT_AGREEMENT_36_GLOBAL.agreementVersion,
    updated_at: new Date().toISOString(),
  };
}

function buildAgreement36FiscalPayload(fiscalYear: number) {
  return {
    fiscal_year: fiscalYear,
    group_key: "",
    staff_type: null,
    special_daily_hours: DEFAULT_AGREEMENT_36_FISCAL.specialDailyHours,
    special_monthly_hours: DEFAULT_AGREEMENT_36_FISCAL.specialMonthlyHours,
    special_exceed_count: DEFAULT_AGREEMENT_36_FISCAL.specialExceedCount,
    special_yearly_hours: DEFAULT_AGREEMENT_36_FISCAL.specialYearlyHours,
    alert_daily_enabled: DEFAULT_AGREEMENT_36_FISCAL.alertDailyEnabled,
    alert_daily_hours: DEFAULT_AGREEMENT_36_FISCAL.alertDailyHours,
    alert_weekly_enabled: DEFAULT_AGREEMENT_36_FISCAL.alertWeeklyEnabled,
    alert_weekly_hours: DEFAULT_AGREEMENT_36_FISCAL.alertWeeklyHours,
    alert_monthly_enabled: DEFAULT_AGREEMENT_36_FISCAL.alertMonthlyEnabled,
    alert_monthly_hours: DEFAULT_AGREEMENT_36_FISCAL.alertMonthlyHours,
    alert_avg_2_6_enabled: DEFAULT_AGREEMENT_36_FISCAL.alertAvg26Enabled,
    alert_avg_2_6_hours: DEFAULT_AGREEMENT_36_FISCAL.alertAvg26Hours,
    alert_yearly_enabled: DEFAULT_AGREEMENT_36_FISCAL.alertYearlyEnabled,
    alert_yearly_hours: DEFAULT_AGREEMENT_36_FISCAL.alertYearlyHours,
    alert_exceed_count_enabled: DEFAULT_AGREEMENT_36_FISCAL.alertExceedCountEnabled,
    alert_exceed_count: DEFAULT_AGREEMENT_36_FISCAL.alertExceedCount,
    notify_employee: DEFAULT_AGREEMENT_36_FISCAL.notifyEmployee,
    notify_admin: DEFAULT_AGREEMENT_36_FISCAL.notifyAdmin,
    notify_custom: DEFAULT_AGREEMENT_36_FISCAL.notifyCustom,
    notify_custom_user_id: DEFAULT_AGREEMENT_36_FISCAL.notifyCustomUserId,
    notify_custom_email: DEFAULT_AGREEMENT_36_FISCAL.notifyCustomEmail?.trim() || null,
    notify_employee_line: DEFAULT_AGREEMENT_36_FISCAL.notifyEmployeeLine,
    notify_admin_line: DEFAULT_AGREEMENT_36_FISCAL.notifyAdminLine,
    notify_custom_line: DEFAULT_AGREEMENT_36_FISCAL.notifyCustomLine,
    notify_custom_line_user_id: DEFAULT_AGREEMENT_36_FISCAL.notifyCustomLineUserId,
    updated_at: new Date().toISOString(),
  };
}

async function ensureDefaultAgreement36Global(
  tenantId: string
): Promise<void> {
  const supabase = getDbClient();
  const { count, error } = await supabase
    .from("m_employment_agreement_36")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("fiscal_year", AGREEMENT_36_GLOBAL_FISCAL_YEAR);

  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;

  const { error: insertError } = await supabase
    .from("m_employment_agreement_36")
    .insert({
      tenant_id: tenantId,
      ...buildAgreement36GlobalPayload(),
      ...buildAgreement36FiscalPayload(AGREEMENT_36_GLOBAL_FISCAL_YEAR),
    });

  if (insertError) throw new Error(insertError.message);
}

async function getAgreement36Row(
  tenantId: string,
  fiscalYear: number
): Promise<Record<string, unknown> | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("m_employment_agreement_36")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("fiscal_year", fiscalYear)
    .eq("group_key", "")
    .is("staff_type", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Record<string, unknown> | null) ?? null;
}

export async function getAgreement36Settings(
  tenantId: string,
  fiscalYear: number
): Promise<{ global: Agreement36Global; fiscal: Agreement36Fiscal }> {
  await ensureDefaultAgreement36Global(tenantId);
  const supabase = getDbClient();

  let globalRow = await getAgreement36Row(
    tenantId,
    AGREEMENT_36_GLOBAL_FISCAL_YEAR
  );
  if (!globalRow) {
    const { data, error } = await supabase
      .from("m_employment_agreement_36")
      .insert({
        tenant_id: tenantId,
        ...buildAgreement36GlobalPayload(),
        ...buildAgreement36FiscalPayload(AGREEMENT_36_GLOBAL_FISCAL_YEAR),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    globalRow = data as Record<string, unknown>;
  }

  let fiscalRow = await getAgreement36Row(tenantId, fiscalYear);
  if (!fiscalRow) {
    const { data, error } = await supabase
      .from("m_employment_agreement_36")
      .insert({
        tenant_id: tenantId,
        ...buildAgreement36GlobalPayload(),
        ...buildAgreement36FiscalPayload(fiscalYear),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    fiscalRow = data as Record<string, unknown>;
  }

  return {
    global: mapAgreement36GlobalRow(globalRow),
    fiscal: mapAgreement36FiscalRow(fiscalRow),
  };
}
