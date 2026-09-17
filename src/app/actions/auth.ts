"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { generatePublicToken } from "@/lib/tokens";
import { isEmailConfigured } from "@/lib/email/client";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { getBaseUrl } from "@/lib/site-url";
import {
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
} from "@/lib/constants";

export type ActionState = { error: string | null };

const registerSchema = z
  .object({
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

const forgotPasswordSchema = z.object({
  email: z.email("بريد إلكتروني غير صحيح"),
});

/**
 * طلب إعادة تعيين كلمة مرور ذاتيًا عبر البريد الإلكتروني. لا يكشف أبدًا
 * إن كان البريد مسجَّلًا أم لا (يُعيد نفس رسالة النجاح في الحالتين) لمنع
 * استكشاف الحسابات — الاستثناء الوحيد هو عدم ضبط خدمة البريد على
 * الخادم، حيث يُعرض ذلك صراحةً مع توجيه لمسار الإدارة العامة البديل.
 */
export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بريد إلكتروني غير صحيح" };
  }

  if (!isEmailConfigured()) {
    return {
      error:
        "خدمة البريد الإلكتروني غير مفعّلة على الخادم حاليًا — تواصل مع الإدارة العامة للتعليم لإعادة تعيين كلمة المرور يدويًا.",
    };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = generatePublicToken();
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    const baseUrl = await getBaseUrl();
    await sendPasswordResetEmail(user.email, `${baseUrl}/reset-password/${token}`);
  }

  redirect("/forgot-password?sent=1");
}

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

/**
 * إعادة تعيين كلمة المرور عبر رابط — سواء وصل بالبريد الإلكتروني
 * (requestPasswordResetAction) أو صادر يدويًا من لوحة الإدارة العامة
 * (generatePasswordResetAction). لا تسجيل دخول مطلوب؛ يتحقّق أن الرمز
 * صالح، غير مُستخدَم، ولم تمضِ مدته (24 ساعة).
 */
export async function resetPasswordAction(
  token: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
    return { error: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=1");
}
