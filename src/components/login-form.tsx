"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/actions/auth";
import { Field, TextInput, ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="البريد الإلكتروني">
        <TextInput
          type="email"
          name="email"
          placeholder="manager@school.com"
          dir="ltr"
          className="text-right"
          required
        />
      </Field>

      <Field label="كلمة المرور">
        <TextInput type="password" name="password" required />
      </Field>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ تسجيل الدخول…">
        تسجيل الدخول
      </SubmitButton>
    </form>
  );
}
