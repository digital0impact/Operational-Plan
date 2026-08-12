"use client";

import { useActionState } from "react";
import { saveKeyIssuesAction } from "@/app/actions/wizard";
import { suggestKeyIssuesAction } from "@/app/actions/ai";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { RepeatableList } from "@/components/wizard/repeatable-list";

const initialState: ActionState = { error: null };

export function KeyIssuesForm({ items }: { items: string[] }) {
  const [state, formAction] = useActionState(saveKeyIssuesAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        استخلص القضايا الرئيسية التي تواجه المدرسة استنادًا إلى نقاط الضعف
        والتهديدات التي حددتها.
      </p>

      <RepeatableList
        name="items"
        initialItems={items}
        addLabel="إضافة قضية"
        aiSuggest={{
          label: "رشّح قضايا بالذكاء الاصطناعي",
          onGenerate: suggestKeyIssuesAction,
        }}
      />

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">
        حفظ ومتابعة إلى المبادرات ←
      </SubmitButton>
    </form>
  );
}
