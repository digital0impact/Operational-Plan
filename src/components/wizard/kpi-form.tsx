"use client";

import { useActionState, useRef } from "react";
import { saveStep7Action, saveStep8Action } from "@/app/actions/wizard";
import { suggestKpiAction } from "@/app/actions/ai";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { AiSuggestButton } from "@/components/ai-suggest-button";

const initialState: ActionState = { error: null };

type GoalRow = {
  operationalGoalId: string;
  order: number;
  strategicTitle: string;
  operationalText: string;
  indicator: string;
  targetValue: string;
};

export function KpiIndicatorForm({ goals }: { goals: GoalRow[] }) {
  const [state, formAction] = useActionState(saveStep7Action, initialState);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        حدد مؤشر قياس أداء واحدًا لكل هدف تشغيلي.
      </p>

      <div className="flex flex-col gap-4">
        {goals.map((goal) => (
          <div key={goal.operationalGoalId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink">
                {goal.order}. {goal.operationalText || goal.strategicTitle}
              </span>
              <AiSuggestButton
                onGenerate={() => suggestKpiAction(goal.operationalGoalId)}
                onResult={(data) => {
                  const el = inputRefs.current[goal.operationalGoalId];
                  if (el) el.value = data.indicator;
                }}
              />
            </div>
            <input
              ref={(el) => {
                inputRefs.current[goal.operationalGoalId] = el;
              }}
              name={`kpi_${goal.operationalGoalId}`}
              defaultValue={goal.indicator}
              placeholder="مؤشر قياس الأداء…"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
            />
          </div>
        ))}
      </div>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">
        حفظ ومتابعة إلى القيم المستهدفة ←
      </SubmitButton>
    </form>
  );
}

export function KpiTargetForm({ goals }: { goals: GoalRow[] }) {
  const [state, formAction] = useActionState(saveStep8Action, initialState);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        حدد القيمة المستهدفة لكل مؤشر (نسبة، عدد، أو وصف مختصر).
      </p>

      <div className="flex flex-col gap-4">
        {goals.map((goal) => (
          <div key={goal.operationalGoalId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink">
                {goal.order}. {goal.indicator || "— لم يُحدَّد مؤشر بعد —"}
              </span>
              <AiSuggestButton
                onGenerate={() => suggestKpiAction(goal.operationalGoalId)}
                onResult={(data) => {
                  const el = inputRefs.current[goal.operationalGoalId];
                  if (el) el.value = data.targetValue;
                }}
              />
            </div>
            <input
              ref={(el) => {
                inputRefs.current[goal.operationalGoalId] = el;
              }}
              name={`target_${goal.operationalGoalId}`}
              defaultValue={goal.targetValue}
              placeholder="القيمة المستهدفة…"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
            />
          </div>
        ))}
      </div>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">
        حفظ ومتابعة إلى تحليل SWOT ←
      </SubmitButton>
    </form>
  );
}
