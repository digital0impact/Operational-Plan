"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSchoolId } from "@/lib/auth-guards";
import { getCurrentUser } from "@/lib/session";
import { createSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { generatePublicToken } from "@/lib/tokens";
import { schoolHasFullAccess, MAX_TEAM_SEATS } from "@/lib/subscription";
import type { ActionState } from "@/app/actions/auth";

/**
 * دعوة عضو فريق جديد (متاحة لمدير المدرسة فقط، وفقط مع الاشتراك الشامل،
 * وضمن حد 4 حسابات للمدرسة الواحدة). لا يوجد إرسال بريد فعلي — يُنشأ
 * رابط دعوة فريد يظهر في القائمة لينسخه المدير ويرسله بنفسه.
 */

const inviteSchema = z.object({
  email: z.email("بريد إلكتروني غير صحيح"),
});

export async function inviteTeamMemberAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const user = await getCurrentUser();
  if (user?.role !== "SCHOOL_MANAGER") {
    return { error: "دعوة أعضاء الفريق متاحة لمدير المدرسة فقط" };
  }
  if (!(await schoolHasFullAccess(schoolId))) {
    return { error: "دعوة أعضاء الفريق متاحة فقط مع الاشتراك الشامل" };
  }

  const parsed = inviteSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بريد إلكتروني غير صحيح" };
  }
  const email = parsed.data.email.toLowerCase();

  const [seatsUsed, existingUser, existingInvite] = await Promise.all([
    Promise.all([
      prisma.user.count({ where: { schoolId } }),
      prisma.teamInvite.count({ where: { schoolId, acceptedAt: null } }),
    ]).then(([users, invites]) => users + invites),
    prisma.user.findUnique({ where: { email } }),
    prisma.teamInvite.findUnique({ where: { schoolId_email: { schoolId, email } } }),
  ]);

  if (seatsUsed >= MAX_TEAM_SEATS) {
    return { error: `بلغتَ الحد الأقصى (${MAX_TEAM_SEATS}) لحسابات المدرسة الواحدة` };
  }
  if (existingUser) {
    return { error: "هذا البريد مرتبط بحساب مستخدم بالفعل" };
  }
  if (existingInvite && !existingInvite.acceptedAt) {
    return { error: "تم إرسال دعوة لهذا البريد بالفعل — انسخ رابطها من القائمة أدناه" };
  }

  await prisma.teamInvite.upsert({
    where: { schoolId_email: { schoolId, email } },
    update: { token: generatePublicToken(), createdAt: new Date(), acceptedAt: null },
    create: { schoolId, email, token: generatePublicToken() },
  });

  redirect("/subscription");
}

/** إلغاء دعوة معلَّقة (مدير المدرسة فقط) — يُحرّر مقعدًا. */
export async function revokeInviteAction(id: string): Promise<void> {
  const schoolId = await requireSchoolId();
  const user = await getCurrentUser();
  if (user?.role !== "SCHOOL_MANAGER") redirect("/subscription");
  await prisma.teamInvite.deleteMany({ where: { id, schoolId, acceptedAt: null } });
  redirect("/subscription");
}

/** إزالة عضو فريق من المدرسة (مدير المدرسة فقط) — يحذف حسابه فعليًا. */
export async function removeTeamMemberAction(userId: string): Promise<void> {
  const schoolId = await requireSchoolId();
  const user = await getCurrentUser();
  if (user?.role !== "SCHOOL_MANAGER") redirect("/subscription");
  await prisma.user.deleteMany({ where: { id: userId, schoolId, role: "TEAM_MEMBER" } });
  redirect("/subscription");
}

const acceptInviteSchema = z
  .object({
    name: z.string().trim().min(3, "الاسم قصير جدًا"),
    password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

/** قبول دعوة انضمام (رابط عام بلا تسجيل دخول) — يُنشئ حساب TEAM_MEMBER فعليًا. */
export async function acceptTeamInviteAction(
  token: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const invite = await prisma.teamInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt) {
    return { error: "الدعوة غير صالحة أو استُخدمت بالفعل" };
  }

  const parsed = acceptInviteSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    return { error: "البريد الإلكتروني مستخدم بالفعل" };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: invite.email,
        passwordHash,
        role: "TEAM_MEMBER",
        schoolId: invite.schoolId,
      },
    });
    await tx.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return newUser;
  });

  await createSession(user.id);
  redirect("/dashboard");
}
