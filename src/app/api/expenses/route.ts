import { NextRequest, NextResponse } from "next/server";
import { createExpense, listExpenses } from "@/lib/db/repository";
import { uploadExpenseReceipt } from "@/lib/google/uploads";
import { withPermission } from "@/lib/permissions/check";
import type { Expense } from "@/lib/types";

type ExpenseCreateBody = Omit<
  Expense,
  "id" | "createdAt" | "projectName" | "userName" | "categoryName"
>;

async function parseExpenseRequest(request: NextRequest): Promise<{
  body: ExpenseCreateBody;
  receipt: { buffer: Buffer; mimeType: string } | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const payload = form.get("payload");
    if (typeof payload !== "string") {
      throw new Error("payload が不正です");
    }
    const body = JSON.parse(payload) as ExpenseCreateBody;
    const file = form.get("receipt");
    if (file instanceof File && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      return {
        body,
        receipt: { buffer, mimeType: file.type || "image/jpeg" },
      };
    }
    return { body, receipt: null };
  }

  const body = (await request.json()) as ExpenseCreateBody;
  return { body, receipt: null };
}

export async function GET(request: NextRequest) {
  return withPermission(request, "expense_register", async ({ session }) => {
    const { searchParams } = request.nextUrl;
    try {
      const expenses = await listExpenses(session.tenantId, {
        userId: searchParams.get("userId") ?? undefined,
        projectId: searchParams.get("projectId") ?? undefined,
        expenseDate: searchParams.get("expenseDate") ?? undefined,
      });
      return NextResponse.json({ expenses });
    } catch (e) {
      const message = e instanceof Error ? e.message : "取得に失敗しました";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withPermission(request, "expense_register", async ({ session }) => {
    try {
      const { body, receipt } = await parseExpenseRequest(request);
      const expense = await createExpense(session.tenantId, {
        projectId: body.projectId,
        userId: session.id,
        amount: Number(body.amount),
        categoryId: body.categoryId,
        expenseDate: body.expenseDate,
        status: body.status ?? "submitted",
        inputMethod: body.inputMethod ?? "manual",
        memo: body.memo,
      } as Omit<
        Expense,
        "id" | "createdAt" | "projectName" | "userName" | "categoryName"
      >);

      let driveFileId: string | null = null;
      if (receipt) {
        driveFileId = await uploadExpenseReceipt(
          session.tenantId,
          expense,
          receipt
        );
      }

      return NextResponse.json({ expense, driveFileId }, { status: 201 });
    } catch (e) {
      const message = e instanceof Error ? e.message : "登録に失敗しました";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
