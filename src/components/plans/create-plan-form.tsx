"use client";

import { useActionState } from "react";
import { createPlanAction } from "@/app/actions/plans";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

export function CreatePlanForm({
  templateId,
  nameAr,
  nameEn,
}: {
  templateId: string;
  nameAr: string;
  nameEn: string;
}) {
  const [state, formAction] = useActionState(createPlanAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
    >
      <input type="hidden" name="templateId" value={templateId} />
      <div>
        <h2 className="text-base font-bold text-ink">{nameAr}</h2>
        <p className="text-xs text-muted" dir="ltr">
          {nameEn}
        </p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">السنة الدراسية</span>
        <input
          type="text"
          name="academicYear"
          placeholder="مثال: 1447-1448هـ"
          required
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </label>
      <ErrorNotice message={state.error} />
      <SubmitButton pendingLabel="جارٍ الإنشاء…">إنشاء الخطة ←</SubmitButton>
    </form>
  );
}
