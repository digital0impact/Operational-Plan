"use client";

import { useActionState } from "react";
import { saveInitiativesAction } from "@/app/actions/wizard";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { RepeatableList } from "@/components/wizard/repeatable-list";

const initialState: ActionState = { error: null };

export function InitiativesStepForm({
  type,
  step,
  itemLabel,
  goals,
}: {
  type: string;
  step: number;
  itemLabel: string;
  goals: {
    operationalGoalId: string;
    order: number;
    title: string;
    items: string[];
  }[];
}) {
  const action = saveInitiativesAction.bind(null, type, step);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        أضف {itemLabel} واحدًا أو أكثر تحت كل هدف تشغيلي.
      </p>

      <div className="flex flex-col gap-5">
        {goals.map((goal) => (
          <div
            key={goal.operationalGoalId}
            className="rounded-lg border border-border bg-surface-2 p-4"
          >
            <p className="mb-2.5 text-sm font-semibold text-ink">
              {goal.order}. {goal.title}
            </p>
            <RepeatableList
              name={`items_${goal.operationalGoalId}`}
              initialItems={goal.items}
              placeholder={`اسم ${itemLabel}…`}
              addLabel={`إضافة ${itemLabel}`}
            />
          </div>
        ))}
      </div>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">
        حفظ ومتابعة ←
      </SubmitButton>
    </form>
  );
}
