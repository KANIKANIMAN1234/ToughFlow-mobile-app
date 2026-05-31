import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  // デモ OCR（本番: OpenAI Vision API）
  return NextResponse.json({
    amount: 6800,
    categoryName: "高速代",
    expenseDate: new Date().toISOString().slice(0, 10),
    confidence: 0.9,
    rawText: "領収書 OCR デモ結果",
  });
}
