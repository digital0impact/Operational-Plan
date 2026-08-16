"use client";

import { useActionState } from "react";
import { saveIndicatorsListSectionAction } from "@/app/actions/plans";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

type ObjectiveIndicatorRow = {
  objectiveId: string;
  order: number;
  text: string;
  indicator: string;
  targetValue: string;
  actualValue: string;
};

export function IndicatorsListSection({
  planId,
  sectionKey,
  rows,
}: {
  planId: string;
  sectionKey: string;
  rows: ObjectiveIndicatorRow[];
}) {
  const action = saveIndicatorsListSectionAction.bind(null, planId, sectionKey);
  const [state, formAction] = useActionState(action, initialState);

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        لا توجد أهداف بعد — أضفها في قسم الأهداف أولًا قبل تحديد مؤشراتها.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {rows.map((row, index) => (
        <div key={row.objectiveId} className="rounded-lg border border-border bg-surface-2 p-4">
          <p className="mb-2.5 text-sm font-semibold text-ink">
            {index + 1}. {row.text}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">المؤشر</span>
              <input
                name={`indicator_${row.objectiveId}`}
                defaultValue={row.indicator}
                placeholder="مؤشر قياس الأداء…"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">القيمة المستهدفة</span>
              <input
                name={`target_${row.objectiveId}`}
                defaultValue={row.targetValue}
                placeholder="القيمة المستهدفة…"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">القيمة الفعلية</span>
              <input
                name={`actual_${row.objectiveId}`}
                defaultValue={row.actualValue}
                placeholder="القيمة المتحققة حتى الآن…"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
          </div>
        </div>
      ))}

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">حفظ ومتابعة ←</SubmitButton>
    </form>
  );
}
