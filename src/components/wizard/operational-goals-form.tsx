"use client";

import { useActionState, useRef } from "react";
import { saveStep6Action } from "@/app/actions/wizard";
import { suggestOperationalGoalAction } from "@/app/actions/ai";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { AiSuggestButton } from "@/components/ai-suggest-button";

const initialState: ActionState = { error: null };

export function OperationalGoalsForm({
  goals,
}: {
  goals: { strategicGoalId: string; order: number; title: string; text: string }[];
}) {
  const [state, formAction] = useActionState(saveStep6Action, initialState);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        اكتب هدفًا تشغيليًا واحدًا للمدرسة يقابل كل هدف استراتيجي.
      </p>

      <div className="flex flex-col gap-4">
        {goals.map((goal) => (
          <div key={goal.strategicGoalId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink">
                {goal.order}. {goal.title}
              </span>
              <AiSuggestButton
                onGenerate={() => suggestOperationalGoalAction(goal.strategicGoalId)}
                onResult={(data) => {
                  const el = textareaRefs.current[goal.strategicGoalId];
                  if (el) el.value = data.operationalGoal;
                }}
              />
            </div>
            <textarea
              ref={(el) => {
                textareaRefs.current[goal.strategicGoalId] = el;
              }}
              name={`goal_${goal.strategicGoalId}`}
              defaultValue={goal.text}
              rows={2}
              placeholder="الهدف التشغيلي المقابل لهذا الهدف الاستراتيجي…"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
            />
          </div>
        ))}
      </div>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">
        حفظ ومتابعة إلى مؤشرات الأداء ←
      </SubmitButton>
    </form>
  );
}
