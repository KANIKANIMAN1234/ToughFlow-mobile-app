import { NextRequest, NextResponse } from "next/server";
import {
  addExpense,
  createId,
  listExpenses,
} from "@/lib/store/mock-store";
import type { Expense } from "@/lib/types";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
  return NextResponse.json({ expenses: listExpenses(userId) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const expense: Expense = {
    id: createId("exp"),
    projectId: body.projectId,
    projectName: body.projectName,
    userId: body.userId,
    userName: body.userName,
    amount: Number(body.amount),
    categoryId: body.categoryId,
    categoryName: body.categoryName,
    expenseDate: body.expenseDate,
    status: body.status ?? "submitted",
    inputMethod: body.inputMethod ?? "manual",
    memo: body.memo,
    createdAt: new Date().toISOString(),
  };

  addExpense(expense);
  return NextResponse.json({ expense }, { status: 201 });
}
