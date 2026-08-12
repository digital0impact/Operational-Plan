"use client";

import { useActionState } from "react";
import { saveSwotItemsAction } from "@/app/actions/wizard";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { RepeatableList } from "@/components/wizard/repeatable-list";

const initialState: ActionState = { error: null };

export function SwotStepForm({
  category,
  step,
  items,
  hint,
  nextLabel,
}: {
  category: string;
  step: number;
  items: string[];
  hint: string;
  nextLabel: string;
}) {
  const action = saveSwotItemsAction.bind(null, category, step);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted">{hint}</p>

      <RepeatableList name="items" initialItems={items} addLabel="إضافة بند" />

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">{nextLabel}</SubmitButton>
    </form>
  );
}
