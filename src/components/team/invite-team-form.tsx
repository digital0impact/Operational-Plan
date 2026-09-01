"use client";

import { useActionState } from "react";
import { inviteTeamMemberAction } from "@/app/actions/team";
import type { ActionState } from "@/app/actions/auth";
import { Field, TextInput, ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

export function InviteTeamForm() {
  const [state, formAction] = useActionState(inviteTeamMemberAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field label="بريد العضو الجديد">
        <TextInput
          type="email"
          name="email"
          placeholder="teacher@school.com"
          dir="ltr"
          className="w-64 text-right"
          required
        />
      </Field>
      <SubmitButton pendingLabel="جارٍ الإنشاء…">إنشاء رابط دعوة</SubmitButton>
      {state.error ? (
        <div className="w-full">
          <ErrorNotice message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
