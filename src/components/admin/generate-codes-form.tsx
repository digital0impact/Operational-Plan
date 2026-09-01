"use client";

import { useActionState } from "react";
import { generateActivationCodesAction } from "@/app/actions/admin";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

export function GenerateCodesForm({
  planTypes,
}: {
  planTypes: { id: string; nameAr: string }[];
}) {
  const [state, formAction] = useActionState(
    generateActivationCodesAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">عدد الرموز</span>
        <input
          type="number"
          name="count"
          min={1}
          max={50}
          defaultValue={1}
          required
          className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">مدة الاشتراك</span>
        <select
          name="durationMonths"
          defaultValue={12}
          className="w-36 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        >
          <option value={6}>نصف سنوي (6 أشهر)</option>
          <option value={12}>سنوي (12 شهرًا)</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">نطاق الرمز</span>
        <select
          name="planTypeId"
          defaultValue=""
          className="w-52 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        >
          <option value="">شامل (كل أنواع الخطط)</option>
          {planTypes.map((type) => (
            <option key={type.id} value={type.id}>
              خطة واحدة: {type.nameAr}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 min-w-[200px] flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">ملاحظة (اختياري)</span>
        <input
          type="text"
          name="issuedFor"
          placeholder="مثال: مدارس إدارة تعليم الرياض"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </label>
      <SubmitButton pendingLabel="جارٍ الإصدار…">إصدار</SubmitButton>
      {state.error ? (
        <div className="w-full">
          <ErrorNotice message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
