"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/app/actions/auth";
import type { ActionState } from "@/app/actions/auth";
import { Field, TextInput, ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

export function ResetPasswordForm({ token }: { token: string }) {
  const action = resetPasswordAction.bind(null, token);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="كلمة المرور الجديدة">
          <TextInput type="password" name="password" required minLength={8} />
        </Field>
        <Field label="تأكيد كلمة المرور">
          <TextInput type="password" name="confirmPassword" required minLength={8} />
        </Field>
      </div>
      <ErrorNotice message={state.error} />
      <SubmitButton pendingLabel="جارٍ الحفظ…">تعيين كلمة المرور</SubmitButton>
    </form>
  );
}
