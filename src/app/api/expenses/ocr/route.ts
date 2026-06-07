import { NextRequest, NextResponse } from "next/server";
import { listExpenseCategories } from "@/lib/db/repository";
import { extractReceiptFromImage } from "@/lib/openai/receipt-ocr";
import { requirePermission } from "@/lib/permissions/check";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "expense_register");
  if (auth instanceof Response) return auth;

  const form = await request.formData();
  const file = form.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  try {
    const categories = await listExpenseCategories(auth.session.tenantId);
    const categoryNames = categories.map((c) => c.name);
    const buffer = await file.arrayBuffer();
    const mimeType = file.type || "image/jpeg";

    const result = await extractReceiptFromImage(
      buffer,
      mimeType,
      categoryNames
    );

    if (!result.demo && result.amount == null) {
      return NextResponse.json(
        {
          error: "金額を読み取れませんでした。手動で入力してください。",
          rawText: result.rawText,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      amount: result.amount,
      categoryName: result.categoryName,
      expenseDate: result.expenseDate ?? new Date().toISOString().slice(0, 10),
      storeName: result.storeName,
      confidence: result.confidence,
      rawText: result.rawText,
      demo: result.demo ?? false,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "OCR に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
