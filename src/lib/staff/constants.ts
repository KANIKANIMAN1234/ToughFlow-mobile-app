import type { StaffType } from "@/lib/types";

/** 正社員・契約社員以外は時給を登録する */
export function staffTypeUsesHourlyWage(staffType: StaffType): boolean {
  return staffType !== "full_time" && staffType !== "contract";
}
