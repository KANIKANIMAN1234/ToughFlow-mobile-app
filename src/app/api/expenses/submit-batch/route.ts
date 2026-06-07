import { NextRequest, NextResponse } from "next/server";
import { submitExpenseBatch } from "@/lib/db/repository";
import { withPermission } from "@/lib/permissions/check";

export async function POST(request: NextRequest) {
  return withPermission(request, "expense_register", async ({ session }) => {
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
  });
}
