export type ReceiptOcrResult = {
  amount: number | null;
  categoryName: string | null;
  expenseDate: string | null;
  storeName: string | null;
  confidence: number;
  rawText: string;
  demo?: boolean;
};

const DEMO_RESULT: ReceiptOcrResult = {
  amount: 6800,
  categoryName: "高速代",
  expenseDate: new Date().toISOString().slice(0, 10),
  storeName: null,
  confidence: 0.5,
  rawText: "デモ OCR（OPENAI_API_KEY 未設定）",
  demo: true,
};

function parseJsonContent(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OCR 結果の解析に失敗しました");
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

function pickCategory(
  value: unknown,
  categories: string[]
): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim();
  const exact = categories.find((c) => c === normalized);
  if (exact) return exact;
  const partial = categories.find(
    (c) => normalized.includes(c) || c.includes(normalized)
  );
  return partial ?? null;
}

export async function extractReceiptFromImage(
  buffer: ArrayBuffer,
  mimeType: string,
  categoryNames: string[]
): Promise<ReceiptOcrResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return DEMO_RESULT;

  const base64 = Buffer.from(buffer).toString("base64");
  const categories =
    categoryNames.length > 0
      ? categoryNames.join("、")
      : "高速代、ガソリン代、消耗品、その他";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "あなたは日本の領収書画像を読み取るアシスタントです。",
              "次の JSON のみを返してください:",
              '{"amount":数値|null,"expenseDate":"YYYY-MM-DD"|null,"categoryName":"文字列"|null,"storeName":"文字列"|null,"confidence":0〜1,"rawText":"読み取った主要テキスト"}',
              `categoryName は次のいずれかに最も近いものを選んでください: ${categories}`,
              "読み取れない項目は null にしてください。",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              { type: "text", text: "この領収書を読み取ってください。" },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`OpenAI API エラー: ${detail}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OCR 結果が空です");

    const parsed = parseJsonContent(content);
    const amountRaw = parsed.amount;
    const amount =
      typeof amountRaw === "number"
        ? amountRaw
        : typeof amountRaw === "string"
          ? Number(amountRaw.replace(/[^\d]/g, ""))
          : null;

    return {
      amount: amount && !Number.isNaN(amount) ? amount : null,
      categoryName: pickCategory(parsed.categoryName, categoryNames),
      expenseDate:
        typeof parsed.expenseDate === "string" ? parsed.expenseDate : null,
      storeName:
        typeof parsed.storeName === "string" ? parsed.storeName : null,
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
      rawText:
        typeof parsed.rawText === "string"
          ? parsed.rawText
          : "OpenAI Vision OCR",
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("OCR がタイムアウトしました。手動で入力してください。");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
