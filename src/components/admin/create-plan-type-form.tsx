"use client";

import { useActionState } from "react";
import { createPlanTypeAction } from "@/app/actions/plan-types";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

export function CreatePlanTypeForm() {
  const [state, formAction] = useActionState(createPlanTypeAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">المعرّف (إنجليزي)</span>
        <input
          type="text"
          name="key"
          placeholder="student_activity"
          dir="ltr"
          required
          className="w-48 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </label>
      <label className="flex flex-1 min-w-[180px] flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">الاسم بالعربية</span>
        <input
          type="text"
          name="nameAr"
          placeholder="خطة النشاط الطلابي"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </label>
      <label className="flex flex-1 min-w-[180px] flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">الاسم بالإنجليزية</span>
        <input
          type="text"
          name="nameEn"
          dir="ltr"
          placeholder="Student Activities Plan"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </label>
      <div className="w-32">
        <SubmitButton pendingLabel="جارٍ الإنشاء…">إنشاء</SubmitButton>
      </div>
      {state.error ? (
        <div className="w-full">
          <ErrorNotice message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
