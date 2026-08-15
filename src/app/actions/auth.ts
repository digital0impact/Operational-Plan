"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { generatePublicToken } from "@/lib/tokens";
import {
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
} from "@/lib/constants";
import {
  CURRENT_ACADEMIC_YEAR,
  OPERATIONAL_PLAN_TITLE,
  calculateOperationalProgressPercent,
  deriveOperationalPlanStatus,
  ensureOperationalPlanFoundation,
} from "@/lib/plans";

export type ActionState = { error: string | null };

const activationCodePattern = /^SCH-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

const registerSchema = z
  .object({
    activationCode: z
      .string()
      .trim()
      .regex(activationCodePattern, "صيغة رمز التفعيل غير صحيحة (SCH-XXXX-XXXX)"),
    schoolName: z.string().trim().min(3, "اسم المدرسة قصير جدًا"),
    gender: z.enum(
      SCHOOL_GENDER_OPTIONS.map((o) => o.value) as [string, ...string[]],
      { message: "اختر نوع المدرسة" }
    ),
    classification: z.enum(
      SCHOOL_CLASSIFICATION_OPTIONS.map((o) => o.value) as [string, ...string[]],
      { message: "اختر تصنيف المدرسة" }
    ),
    stage: z.enum(
      SCHOOL_STAGE_OPTIONS.map((o) => o.value) as [string, ...string[]],
      { message: "اختر المرحلة الدراسية" }
    ),
    managerName: z.string().trim().min(3, "اسم مدير المدرسة قصير جدًا"),
    email: z.email("بريد إلكتروني غير صحيح"),
    password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export async function registerSchoolAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    activationCode: formData.get("activationCode"),
    schoolName: formData.get("schoolName"),
    gender: formData.get("gender"),
    classification: formData.get("classification"),
    stage: formData.get("stage"),
    managerName: formData.get("managerName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const data = parsed.data;
  const normalizedCode = data.activationCode.toUpperCase();

  const activationCode = await prisma.activationCode.findUnique({
    where: { code: normalizedCode },
  });

  if (!activationCode) {
    return { error: "رمز التفعيل غير موجود" };
  }
  if (activationCode.used) {
    return { error: "رمز التفعيل مُستخدم مسبقًا" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    return { error: "البريد الإلكتروني مستخدم بالفعل" };
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name: data.schoolName,
        gender: data.gender,
        schoolSystem: data.classification,
        unit: data.stage,
        voteToken: generatePublicToken(),
        shareToken: generatePublicToken(),
      },
    });

    const { planType, template } = await ensureOperationalPlanFoundation(tx);

    await tx.plan.upsert({
      where: { schoolId_planTypeId: { schoolId: school.id, planTypeId: planType.id } },
      update: {},
      create: {
        schoolId: school.id,
        planTypeId: planType.id,
        templateId: template.id,
        academicYear: CURRENT_ACADEMIC_YEAR,
        title: OPERATIONAL_PLAN_TITLE,
        status: deriveOperationalPlanStatus(0, school.currentStep),
        currentStep: school.currentStep,
        progressPercent: calculateOperationalProgressPercent(0),
        shareToken: school.shareToken,
        voteToken: school.voteToken,
      },
    });

    await tx.activationCode.update({
      where: { id: activationCode.id },
      data: { used: true, usedAt: new Date(), schoolId: school.id },
    });

    return tx.user.create({
      data: {
        name: data.managerName,
        email: data.email,
        passwordHash,
        role: "SCHOOL_MANAGER",
        schoolId: school.id,
      },
    });
  });

  await createSession(user.id);
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.email("بريد إلكتروني غير صحيح"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  await createSession(user.id);
  redirect(user.role === "GENERAL_ADMIN" ? "/admin" : "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
