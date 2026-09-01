"use client";

import { useActionState } from "react";
import { acceptTeamInviteAction } from "@/app/actions/team";
import type { ActionState } from "@/app/actions/auth";
import { Field, TextInput, ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

export function AcceptInviteForm({ token }: { token: string }) {
  const action = acceptTeamInviteAction.bind(null, token);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="اسمك">
        <TextInput name="name" placeholder="الاسم الثلاثي" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="كلمة المرور">
          <TextInput type="password" name="password" required minLength={8} />
        </Field>
        <Field label="تأكيد كلمة المرور">
          <TextInput type="password" name="confirmPassword" required minLength={8} />
        </Field>
      </div>
      <ErrorNotice message={state.error} />
      <SubmitButton pendingLabel="جارٍ الانضمام…">انضمام للفريق</SubmitButton>
    </form>
  );
}
