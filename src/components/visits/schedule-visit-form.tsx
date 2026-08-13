"use client";

import { useActionState } from "react";
import { scheduleVisitAction } from "@/app/actions/visits";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice, Field, TextInput } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

export function ScheduleVisitForm() {
  const [state, formAction] = useActionState(scheduleVisitAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم المعلم/ة *">
          <TextInput name="teacherName" placeholder="الاسم الثلاثي" required />
        </Field>
        <Field label="المادة">
          <TextInput name="subject" placeholder="مثال: الرياضيات" />
        </Field>
        <Field label="الصف/الشعبة">
          <TextInput name="className" placeholder="مثال: الصف الأول (أ)" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="التاريخ *">
            <TextInput type="date" name="date" required />
          </Field>
          <Field label="الوقت *">
            <TextInput type="time" name="time" required />
          </Field>
        </div>
      </div>

      <Field label="الغرض من الزيارة / ملاحظات">
        <textarea
          name="purpose"
          rows={2}
          placeholder="مثال: متابعة استراتيجيات التدريس النشط"
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </Field>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الجدولة…">جدولة الزيارة</SubmitButton>
    </form>
  );
}
