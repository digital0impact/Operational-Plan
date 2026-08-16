"use client";

import { useActionState } from "react";
import { addTemplateSectionAction } from "@/app/actions/plan-types";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice, SelectInput } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { PLAN_SECTION_KINDS } from "@/lib/constants";

const initialState: ActionState = { error: null };

export function AddTemplateSectionForm({
  templateId,
  nextOrder,
}: {
  templateId: string;
  nextOrder: number;
}) {
  const action = addTemplateSectionAction.bind(null, templateId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2.5">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">المعرّف</span>
        <input
          type="text"
          name="key"
          placeholder="section_key"
          dir="ltr"
          required
          className="w-32 rounded-lg border border-border bg-surface px-2.5 py-2 font-mono text-xs text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </label>
      <label className="flex flex-1 min-w-[140px] flex-col gap-1">
        <span className="text-xs font-semibold text-muted">العنوان</span>
        <input
          type="text"
          name="titleAr"
          placeholder="عنوان القسم"
          required
          className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </label>
      <label className="flex min-w-[170px] flex-col gap-1">
        <span className="text-xs font-semibold text-muted">النوع</span>
        <SelectInput
          name="kind"
          options={PLAN_SECTION_KINDS}
          placeholder="اختر النوع"
          required
          className="py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">الترتيب</span>
        <input
          type="number"
          name="order"
          min={0}
          defaultValue={nextOrder}
          required
          className="w-20 rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </label>
      <div className="w-28">
        <SubmitButton pendingLabel="جارٍ الإضافة…">إضافة قسم</SubmitButton>
      </div>
      {state.error ? (
        <div className="w-full">
          <ErrorNotice message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
