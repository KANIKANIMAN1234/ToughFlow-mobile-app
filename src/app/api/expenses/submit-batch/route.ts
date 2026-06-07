import { NextRequest, NextResponse } from "next/server";
import { submitExpenseBatch } from "@/lib/db/repository";
import { requirePermission } from "@/lib/permissions/check";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "expense_register");
  if (auth instanceof Response) return auth;
  const session = auth.session;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      ids?: string[];
    };
    const count = await submitExpenseBatch(
      session.tenantId,
      session.id,
      body.ids
    );
    return NextResponse.json({ count });
  } catch (e) {
    const message = e instanceof Error ? e.message : "一括提出に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
