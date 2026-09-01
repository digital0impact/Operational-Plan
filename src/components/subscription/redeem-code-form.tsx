"use client";

import { useActionState } from "react";
import { redeemActivationCodeAction } from "@/app/actions/subscription";
import type { ActionState } from "@/app/actions/auth";
import { Field, TextInput, ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

export function RedeemCodeForm() {
  const [state, formAction] = useActionState(redeemActivationCodeAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="رمز الاشتراك" hint="الرمز الذي وصلك عند الاشتراك من المتجر">
        <TextInput
          name="code"
          placeholder="SCH-XXXX-XXXX"
          className="text-center font-mono uppercase tracking-widest"
          required
        />
      </Field>
      <ErrorNotice message={state.error} />
      <SubmitButton pendingLabel="جارٍ التفعيل…">تفعيل الاشتراك</SubmitButton>
    </form>
  );
}
