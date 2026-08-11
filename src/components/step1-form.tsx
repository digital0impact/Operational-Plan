"use client";

import { useActionState } from "react";
import { saveStep1Action } from "@/app/actions/wizard";
import type { ActionState } from "@/app/actions/auth";
import {
  Field,
  TextInput,
  SelectInput,
  ChoiceGroup,
  ErrorNotice,
} from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import {
  BUILDING_INDEPENDENCE_OPTIONS,
  BUILDING_TYPE_OPTIONS,
  STUDY_TIME_OPTIONS,
} from "@/lib/constants";

const initialState: ActionState = { error: null };

export function Step1Form({
  defaults,
}: {
  defaults: {
    ministryNumber: string | null;
    studyTime: string | null;
    studentsCount: number | null;
    classroomsCount: number | null;
    buildingType: string | null;
    educationType: string | null;
    buildingIndependence: string | null;
    phone: string | null;
    schoolEmail: string | null;
    address: string | null;
  };
}) {
  const [state, formAction] = useActionState(saveStep1Action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الرقم الوزاري">
          <TextInput
            name="ministryNumber"
            defaultValue={defaults.ministryNumber ?? ""}
          />
        </Field>
        <Field label="وقت الدراسة">
          <SelectInput
            name="studyTime"
            options={STUDY_TIME_OPTIONS}
            defaultValue={defaults.studyTime ?? ""}
            placeholder="اختر وقت الدراسة"
          />
        </Field>
        <Field label="عدد الطلاب">
          <TextInput
            type="number"
            min={0}
            name="studentsCount"
            defaultValue={defaults.studentsCount ?? ""}
          />
        </Field>
        <Field label="عدد الفصول">
          <TextInput
            type="number"
            min={0}
            name="classroomsCount"
            defaultValue={defaults.classroomsCount ?? ""}
          />
        </Field>
        <Field label="نوع المبنى">
          <SelectInput
            name="buildingType"
            options={BUILDING_TYPE_OPTIONS}
            defaultValue={defaults.buildingType ?? ""}
            placeholder="اختر نوع المبنى"
          />
        </Field>
        <Field label="نوع التعليم">
          <TextInput
            name="educationType"
            placeholder="مثال: عام"
            defaultValue={defaults.educationType ?? ""}
          />
        </Field>
      </div>

      <Field label="استقلالية المبنى">
        <ChoiceGroup
          name="buildingIndependence"
          options={BUILDING_INDEPENDENCE_OPTIONS}
          defaultValue={defaults.buildingIndependence ?? undefined}
          columns={2}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="هاتف المدرسة">
          <TextInput
            name="phone"
            dir="ltr"
            className="text-right"
            defaultValue={defaults.phone ?? ""}
          />
        </Field>
        <Field label="بريد المدرسة">
          <TextInput
            type="email"
            name="schoolEmail"
            dir="ltr"
            className="text-right"
            defaultValue={defaults.schoolEmail ?? ""}
          />
        </Field>
      </div>

      <Field label="العنوان">
        <TextInput name="address" defaultValue={defaults.address ?? ""} />
      </Field>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">
        حفظ ومتابعة إلى مستوى الأداء ←
      </SubmitButton>
    </form>
  );
}
