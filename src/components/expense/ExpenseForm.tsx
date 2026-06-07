"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import type { ExpenseCategory, Project } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export function ExpenseForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayISO());
  const [memo, setMemo] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<"manual" | "ocr" | "ocr_edited">(
    "manual"
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ projects: Project[] }>("/api/projects"),
      api.get<{ categories: ExpenseCategory[] }>(
        "/api/masters/expense-categories"
      ),
    ]).then(([p, c]) => {
      setProjects(p.projects);
      setCategories(c.categories);
      if (p.projects[0]) setProjectId(p.projects[0].id);
      if (c.categories[0]) setCategoryId(c.categories[0].id);
    });
  }, []);

  async function handleOcr(file: File) {
    setReceiptFile(file);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(URL.createObjectURL(file));
    setOcrLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/expenses/ocr", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "OCR に失敗しました");
      }
      setAmount(String(data.amount ?? ""));
      setExpenseDate(data.expenseDate ?? todayISO());
      const cat = categories.find((c) => c.name === data.categoryName);
      if (cat) setCategoryId(cat.id);
      setInputMethod("ocr");
    } catch (e) {
      alert(e instanceof Error ? e.message : "OCR に失敗しました");
    } finally {
      setOcrLoading(false);
    }
  }

  async function saveExpense(status: "draft" | "submitted") {
    if (!user || !projectId || !categoryId) return;
    const project = projects.find((p) => p.id === projectId);
    const category = categories.find((c) => c.id === categoryId);
    if (!project || !category) return;

    setSubmitting(true);
    try {
      const payload = {
        projectId,
        projectName: project.name,
        userId: user.id,
        userName: user.name,
        amount: Number(amount),
        categoryId,
        categoryName: category.name,
        expenseDate,
        memo,
        inputMethod,
        status,
      };

      if (receiptFile) {
        const form = new FormData();
        form.append("payload", JSON.stringify(payload));
        form.append("receipt", receiptFile);
        const res = await fetch("/api/expenses", {
          method: "POST",
          body: form,
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "登録に失敗しました");
        }
      } else {
        await api.post("/api/expenses", payload);
      }
      router.push("/expenses");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="立替精算登録">
      <Card title="領収書">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 px-4 py-8">
          {ocrLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          ) : (
            <Camera className="h-8 w-8 text-brand-600" />
          )}
          <span className="text-caption font-normal text-brand-600">
            領収書を撮影（OCR）
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleOcr(file);
            }}
          />
        </label>
        {receiptPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={receiptPreview}
            alt="領収書プレビュー"
            className="mt-3 max-h-40 w-full rounded-lg object-contain"
          />
        )}
        {inputMethod.startsWith("ocr") && (
          <p className="mt-2 text-xs text-green-700">
            OCR 結果を反映しました。内容を確認してください。
          </p>
        )}
      </Card>

      <Card title="入力内容" className="mt-4">
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">案件</span>
            <select
              className="w-full rounded-xl border px-3 py-3"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="金額（円）"
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (inputMethod === "ocr") setInputMethod("ocr_edited");
            }}
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">用途</span>
            <select
              className="w-full rounded-xl border px-3 py-3"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (inputMethod === "ocr") setInputMethod("ocr_edited");
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="発生日"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
          <Input
            label="メモ"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-mobile gap-2 border-t bg-white p-4">
        <Button
          variant="secondary"
          disabled={submitting || !amount}
          onClick={() => saveExpense("draft")}
        >
          {submitting ? "保存中…" : "下書き"}
        </Button>
        <Button
          fullWidth
          disabled={submitting || !amount}
          onClick={() => saveExpense("submitted")}
        >
          {submitting ? "保存中…" : "提出"}
        </Button>
      </div>
    </AppShell>
  );
}
