"use client";

import { useActionState } from "react";
import { savePlanProgramsSectionAction } from "@/app/actions/plans";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { RepeatableList } from "@/components/wizard/repeatable-list";

const initialState: ActionState = { error: null };

type ObjectiveProgramsRow = {
  objectiveId: string;
  order: number;
  text: string;
  programs: { id: string; name: string }[];
};

export function ProgramsListSection({
  planId,
  sectionKey,
  itemLabel,
  rows,
}: {
  planId: string;
  sectionKey: string;
  itemLabel: string;
  rows: ObjectiveProgramsRow[];
}) {
  const action = savePlanProgramsSectionAction.bind(null, planId, sectionKey);
  const [state, formAction] = useActionState(action, initialState);

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        لا توجد أهداف بعد — أضفها في قسم الأهداف أولًا قبل إضافة {itemLabel}.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className="text-sm text-muted">أضف {itemLabel} واحدًا أو أكثر تحت كل هدف.</p>

      {rows.map((row, index) => (
        <div key={row.objectiveId} className="rounded-lg border border-border bg-surface-2 p-4">
          <p className="mb-2.5 text-sm font-semibold text-ink">
            {index + 1}. {row.text}
          </p>
          <RepeatableList
            name={`items_${row.objectiveId}`}
            initialItems={row.programs.map((p) => p.name)}
            placeholder={`اسم ${itemLabel}…`}
            addLabel={`إضافة ${itemLabel}`}
          />
        </div>
      ))}

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">حفظ ومتابعة ←</SubmitButton>
    </form>
  );
}
