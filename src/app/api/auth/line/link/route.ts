import { NextRequest, NextResponse } from "next/server";
import {
  clearLinePendingLinkCookie,
  readLinePendingLink,
} from "@/lib/auth/line-oauth";
import { setSessionCookie } from "@/lib/auth/session";
import { completeLineLink, listUnlinkedUsers } from "@/lib/db/repository";
import { toSupabaseUserMessage } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const pending = readLinePendingLink(request);
  if (!pending) {
    return NextResponse.json(
      { error: "紐付けセッションが無効です。もう一度 LINE でログインしてください。" },
      { status: 401 }
    );
  }

  try {
    const { tenantName, users } = await listUnlinkedUsers(pending.tenantCode);
    return NextResponse.json({
      displayName: pending.displayName ?? null,
      tenantCode: pending.tenantCode,
      tenantName,
      users,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "ユーザー一覧の取得に失敗しました";
    return NextResponse.json({ error: toSupabaseUserMessage(message) }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const pending = readLinePendingLink(request);
  if (!pending) {
    return NextResponse.json(
      { error: "紐付けセッションが無効です。もう一度 LINE でログインしてください。" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as { userId?: string };
    if (!body.userId) {
      return NextResponse.json({ error: "ユーザーを選択してください" }, { status: 400 });
    }

    const user = await completeLineLink(
      pending.tenantCode,
      pending.lineUserId,
      body.userId
    );

    const response = NextResponse.json({ user });
    setSessionCookie(response, user);
    clearLinePendingLinkCookie(response);
    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "紐付けに失敗しました";
    return NextResponse.json({ error: toSupabaseUserMessage(message) }, { status: 400 });
  }
}
