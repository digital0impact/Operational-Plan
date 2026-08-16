"use client";

import { useActionState } from "react";
import { saveObjectivesListSectionAction } from "@/app/actions/plans";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { RepeatableList } from "@/components/wizard/repeatable-list";

const initialState: ActionState = { error: null };

export function ObjectivesListSection({
  planId,
  sectionKey,
  itemLabel,
  placeholder,
  initialItems,
}: {
  planId: string;
  sectionKey: string;
  itemLabel: string;
  placeholder?: string;
  initialItems: string[];
}) {
  const action = saveObjectivesListSectionAction.bind(null, planId, sectionKey);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted">أضف {itemLabel} واحدًا أو أكثر.</p>

      <RepeatableList
        name="items"
        initialItems={initialItems}
        placeholder={placeholder ?? `اكتب ${itemLabel}…`}
        addLabel={`إضافة ${itemLabel}`}
      />

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">حفظ ومتابعة ←</SubmitButton>
    </form>
  );
}
