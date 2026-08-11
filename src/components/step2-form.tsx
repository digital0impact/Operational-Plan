"use client";

import { useActionState } from "react";
import { saveStep2Action } from "@/app/actions/wizard";
import type { ActionState } from "@/app/actions/auth";
import { Field, SelectInput, ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { PERFORMANCE_LEVEL_OPTIONS } from "@/lib/constants";

const initialState: ActionState = { error: null };

const LEVEL_FIELDS: { name: string; label: string }[] = [
  { name: "performanceGeneral", label: "مستوى الأداء العام" },
  { name: "performanceManagement", label: "مستوى الإدارة المدرسية" },
  { name: "performanceTeachingLearning", label: "مستوى التعليم والتعلم" },
  { name: "performanceLearningOutcomes", label: "مستوى نواتج التعلم" },
  { name: "performanceEnvironment", label: "مستوى البيئة المدرسية" },
];

export function Step2Form({
  defaults,
}: {
  defaults: Record<string, string | null>;
}) {
  const [state, formAction] = useActionState(saveStep2Action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {LEVEL_FIELDS.map((field) => (
          <Field key={field.name} label={field.label}>
            <SelectInput
              name={field.name}
              options={PERFORMANCE_LEVEL_OPTIONS}
              defaultValue={defaults[field.name] ?? ""}
              placeholder="اختر المستوى"
            />
          </Field>
        ))}
      </div>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">
        حفظ ومتابعة إلى مدخلات الإجراء ←
      </SubmitButton>
    </form>
  );
}
