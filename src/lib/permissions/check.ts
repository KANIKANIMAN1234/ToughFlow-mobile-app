import { NextRequest, NextResponse } from "next/server";
import type { AccessLevel, User } from "@/lib/types";
import { getUserAccessMap } from "@/lib/db/repository";
import {
  forbiddenResponse,
  getSessionFromRequest,
  unauthorizedResponse,
} from "@/lib/auth/session";

export type PermissionCode = string;

export function isAccessGranted(level: AccessLevel): boolean {
  return level === "allow" || level === "conditional";
}

export async function requirePermission(
  request: NextRequest,
  permissionCode: PermissionCode
): Promise<{ session: User; accessMap: Record<string, AccessLevel> } | NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const accessMap = await getUserAccessMap(
    session.tenantId,
    session.id,
    session.role
  );
  const level = accessMap[permissionCode] ?? "deny";
  if (!isAccessGranted(level)) return forbiddenResponse();

  return { session, accessMap };
}

export async function requireAnyPermission(
  request: NextRequest,
  permissionCodes: PermissionCode[]
): Promise<{ session: User; accessMap: Record<string, AccessLevel> } | NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const accessMap = await getUserAccessMap(
    session.tenantId,
    session.id,
    session.role
  );
  const granted = permissionCodes.some((code) =>
    isAccessGranted(accessMap[code] ?? "deny")
  );
  if (!granted) return forbiddenResponse();

  return { session, accessMap };
}
