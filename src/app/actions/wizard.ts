"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  BUILDING_INDEPENDENCE_OPTIONS,
  BUILDING_TYPE_OPTIONS,
  PERFORMANCE_LEVEL_OPTIONS,
  PROCEDURE_INPUTS,
  STUDY_TIME_OPTIONS,
} from "@/lib/constants";
import type { ActionState } from "@/app/actions/auth";

async function requireSchoolId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.schoolId) {
    redirect("/login");
  }
  return user.schoolId;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const optionalInt = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .refine((value) => value === null || (Number.isInteger(value) && value >= 0), {
    message: "أدخل رقمًا صحيحًا موجبًا",
  });

const step1Schema = z.object({
  ministryNumber: optionalText(50),
  studyTime: z.enum(
    STUDY_TIME_OPTIONS.map((o) => o.value) as [string, ...string[]]
  ).optional().or(z.literal("")).transform((v) => (v ? v : null)),
  studentsCount: optionalInt,
  classroomsCount: optionalInt,
  buildingType: z.enum(
    BUILDING_TYPE_OPTIONS.map((o) => o.value) as [string, ...string[]]
  ).optional().or(z.literal("")).transform((v) => (v ? v : null)),
  educationType: optionalText(100),
  buildingIndependence: z.enum(
    BUILDING_INDEPENDENCE_OPTIONS.map((o) => o.value) as [string, ...string[]]
  ).optional().or(z.literal("")).transform((v) => (v ? v : null)),
  phone: optionalText(30),
  schoolEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.email().safeParse(v).success, {
      message: "بريد إلكتروني غير صحيح",
    }),
  address: optionalText(300),
});

export async function saveStep1Action(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();

  const parsed = step1Schema.safeParse({
    ministryNumber: formData.get("ministryNumber"),
    studyTime: formData.get("studyTime"),
    studentsCount: formData.get("studentsCount"),
    classroomsCount: formData.get("classroomsCount"),
    buildingType: formData.get("buildingType"),
    educationType: formData.get("educationType"),
    buildingIndependence: formData.get("buildingIndependence"),
    phone: formData.get("phone"),
    schoolEmail: formData.get("schoolEmail"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.school.update({
    where: { id: schoolId },
    data: { ...parsed.data, step1CompletedAt: new Date(), currentStep: 2 },
  });

  redirect("/wizard/step-2");
}

const levelEnum = z
  .enum(PERFORMANCE_LEVEL_OPTIONS.map((o) => o.value) as [string, ...string[]])
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

const step2Schema = z.object({
  performanceGeneral: levelEnum,
  performanceManagement: levelEnum,
  performanceTeachingLearning: levelEnum,
  performanceLearningOutcomes: levelEnum,
  performanceEnvironment: levelEnum,
});

export async function saveStep2Action(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();

  const parsed = step2Schema.safeParse({
    performanceGeneral: formData.get("performanceGeneral"),
    performanceManagement: formData.get("performanceManagement"),
    performanceTeachingLearning: formData.get("performanceTeachingLearning"),
    performanceLearningOutcomes: formData.get("performanceLearningOutcomes"),
    performanceEnvironment: formData.get("performanceEnvironment"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.school.update({
    where: { id: schoolId },
    data: { ...parsed.data, step2CompletedAt: new Date(), currentStep: 3 },
  });

  redirect("/wizard/step-3");
}

export async function saveStep3Action(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();

  await prisma.$transaction(
    PROCEDURE_INPUTS.map((input) =>
      prisma.procedureInput.upsert({
        where: { schoolId_type: { schoolId, type: input.type } },
        update: {
          acknowledged: formData.get(`ack_${input.type}`) === "on",
          note: (formData.get(`note_${input.type}`) as string | null) || null,
        },
        create: {
          schoolId,
          type: input.type,
          acknowledged: formData.get(`ack_${input.type}`) === "on",
          note: (formData.get(`note_${input.type}`) as string | null) || null,
        },
      })
    )
  );

  await prisma.school.update({
    where: { id: schoolId },
    data: { step3CompletedAt: new Date(), currentStep: 4 },
  });

  redirect("/wizard/step-4");
}

export async function confirmStep4Action(): Promise<void> {
  const schoolId = await requireSchoolId();

  await prisma.school.update({
    where: { id: schoolId },
    data: { step4CompletedAt: new Date(), currentStep: 4 },
  });

  redirect("/dashboard");
}
