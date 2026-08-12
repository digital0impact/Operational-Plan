"use client";

import { useActionState } from "react";
import { registerSchoolAction, type ActionState } from "@/app/actions/auth";
import {
  Field,
  TextInput,
  SelectInput,
  ChoiceGroup,
  ErrorNotice,
} from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import {
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
} from "@/lib/constants";

const initialState: ActionState = { error: null };

export function RegisterForm() {
  const [state, formAction] = useActionState(registerSchoolAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="رمز التفعيل *" hint="احصل على رمز التفعيل من مدير النظام">
        <TextInput
          name="activationCode"
          placeholder="SCH-XXXX-XXXX"
          className="text-center font-mono uppercase tracking-widest"
          required
        />
      </Field>

      <Field label="اسم المدرسة">
        <TextInput name="schoolName" placeholder="مدرسة…" required />
      </Field>

      <Field label="نوع المدرسة *">
        <ChoiceGroup name="gender" options={SCHOOL_GENDER_OPTIONS} />
      </Field>

      <Field label="تصنيف المدرسة *">
        <ChoiceGroup
          name="classification"
          options={SCHOOL_CLASSIFICATION_OPTIONS}
          columns={3}
        />
      </Field>

      <Field label="المرحلة الدراسية *">
        <SelectInput
          name="stage"
          options={SCHOOL_STAGE_OPTIONS}
          placeholder="اختر المرحلة الدراسية"
          required
        />
      </Field>

      <Field label="اسم مدير المدرسة">
        <TextInput name="managerName" placeholder="الاسم الثلاثي" required />
      </Field>

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

      <div className="grid grid-cols-2 gap-3">
        <Field label="كلمة المرور">
          <TextInput type="password" name="password" required minLength={8} />
        </Field>
        <Field label="تأكيد كلمة المرور">
          <TextInput
            type="password"
            name="confirmPassword"
            required
            minLength={8}
          />
        </Field>
      </div>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ إنشاء الحساب…">
        إنشاء حساب مدرسة جديد
      </SubmitButton>
    </form>
  );
}
