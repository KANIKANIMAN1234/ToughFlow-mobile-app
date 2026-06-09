"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FixedActionBar,
  FixedActionBarSpacer,
} from "@/components/layout/FixedActionBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api/client";
import type { AssignableUser, CustomerOption } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export function ProjectRegisterForm() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [assignees, setAssignees] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [workStartDate, setWorkStartDate] = useState(todayISO());
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  useEffect(() => {
    api
      .get<{ customers: CustomerOption[]; assignees: AssignableUser[] }>(
        "/api/projects/register-meta"
      )
      .then((data) => {
        setCustomers(data.customers);
        setAssignees(data.assignees);
        if (data.customers[0]) setCustomerId(data.customers[0].id);
      })
      .catch((e) => {
        alert(e instanceof Error ? e.message : "データの取得に失敗しました");
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleAssignee(userId: string) {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const result = await api.post<{
        project: { id: string; name: string };
        driveCreated: boolean;
        driveWarning?: string;
      }>("/api/projects", {
        name,
        customerId,
        workStartDate,
        assigneeUserIds: selectedAssignees,
      });

      let message = `案件「${result.project.name}」を登録しました。`;
      if (result.driveCreated) {
        message += "\nGoogle Drive の案件フォルダを作成しました。";
      } else if (result.driveWarning) {
        message += `\n\nDriveフォルダ: ${result.driveWarning}`;
      }
      alert(message);
      router.replace("/projects");
    } catch (e) {
      alert(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-caption text-apple-glyph">読み込み中…</p>;
  }

  return (
    <>
      <div className="space-y-4">
        <Card title="案件情報">
          <div className="space-y-4">
            <Input
              label="案件名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ガンドリル搬入"
            />
            <label className="block space-y-1.5">
              <span className="text-caption font-medium text-apple-text">
                顧客
              </span>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="focus-apple w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-body"
              >
                {customers.length === 0 ? (
                  <option value="">顧客が登録されていません</option>
                ) : (
                  customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <Input
              label="作業開始日"
              type="date"
              value={workStartDate}
              onChange={(e) => setWorkStartDate(e.target.value)}
              hint="Driveフォルダ名に使用します"
            />
          </div>
        </Card>

        <Card title="担当者割り当て">
          <p className="mb-3 text-caption text-apple-glyph">
            選択した担当者に案件が紐づき、Google Drive
            フォルダが作成されます。現場スタッフは割り当てられた案件のみ閲覧できます。
          </p>
          {assignees.length === 0 ? (
            <p className="text-caption text-apple-glyph">
              割り当て可能な現場スタッフがいません。
            </p>
          ) : (
            <div className="space-y-2">
              {assignees.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 rounded-xl border border-surface-border px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(user.id)}
                    onChange={() => toggleAssignee(user.id)}
                  />
                  <span className="text-body text-apple-text">{user.name}</span>
                </label>
              ))}
            </div>
          )}
        </Card>
      </div>

      <FixedActionBarSpacer />
      <FixedActionBar>
        <Button
          fullWidth
          disabled={
            submitting ||
            !name.trim() ||
            !customerId ||
            selectedAssignees.length === 0
          }
          onClick={handleSubmit}
        >
          {submitting ? "登録中…" : "案件を登録"}
        </Button>
      </FixedActionBar>
    </>
  );
}
