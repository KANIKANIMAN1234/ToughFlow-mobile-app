import { NextRequest, NextResponse } from "next/server";
import { createExpense, listExpenses } from "@/lib/db/repository";
import {
  getSessionFromRequest,
  unauthorizedResponse,
} from "@/lib/auth/session";
import type { Expense } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

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
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
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
    return NextResponse.json({ expense }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
