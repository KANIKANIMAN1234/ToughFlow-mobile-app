export function buildStaffName(lastName: string, firstName: string): string {
  return `${lastName.trim()}${firstName.trim() ? ` ${firstName.trim()}` : ""}`.trim();
}
