"use client";

import { useActionState } from "react";
import { saveStep3Action } from "@/app/actions/wizard";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { PROCEDURE_INPUTS } from "@/lib/constants";

const initialState: ActionState = { error: null };

export function Step3Form({
  existing,
}: {
  existing: Record<string, { acknowledged: boolean; note: string | null }>;
}) {
  const [state, formAction] = useActionState(saveStep3Action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        أقرّ بالاطلاع على كل مصدر من مصادر مدخلات الإجراء التالية، مع إمكانية
        إضافة ملاحظة مختصرة (اختياري).
      </p>

      <ul className="flex flex-col gap-3">
        {PROCEDURE_INPUTS.map((input, index) => {
          const current = existing[input.type];
          return (
            <li
              key={input.type}
              className="rounded-lg border border-border bg-surface-2 p-4"
            >
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name={`ack_${input.type}`}
                  defaultChecked={current?.acknowledged ?? false}
                  className="mt-1 h-4 w-4 accent-accent"
                />
                <span className="text-sm font-semibold text-ink">
                  {index + 1}. {input.label}
                </span>
              </label>
              <textarea
                name={`note_${input.type}`}
                defaultValue={current?.note ?? ""}
                placeholder="ملاحظة (اختياري)"
                rows={2}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </li>
          );
        })}
      </ul>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">
        حفظ ومتابعة إلى المراجعة ←
      </SubmitButton>
    </form>
  );
}
