"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSchoolId } from "@/lib/auth-guards";
import { addMonths, isPaidPlan } from "@/lib/subscription";
import type { ActionState } from "@/app/actions/auth";

const activationCodePattern = /^SCH-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

const redeemSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(activationCodePattern, "صيغة الرمز غير صحيحة (SCH-XXXX-XXXX)"),
});

/**
 * المدرسة تُدخل رمز اشتراك حصلت عليه عند الشراء (من المتجر الخارجي) لترقية
 * حسابها. رمز بلا نوع خطة (planTypeId = null) يمنح اشتراكًا شاملًا؛ رمز
 * بنوع خطة محدَّد يمنح اشتراكًا مقتصرًا على تلك الخطة فقط.
 *
 * قواعد الدمج مع اشتراك قائم:
 * - رمز شامل: يُرقّي دائمًا (أو يمدّد) إلى اشتراك شامل، مهما كانت الحالة
 *   الحالية — الترقية لا تُنقص أبدًا.
 * - رمز خطة واحدة، والمدرسة على اشتراك شامل سارٍ بالفعل: يُعامَل كتمديد
 *   وقتٍ إضافي للاشتراك الشامل (لا يُنزله لخطة واحدة).
 * - رمز خطة واحدة، والمدرسة على اشتراك خطة واحدة أخرى مختلفة سارٍ: يُرفَض
 *   برسالة واضحة (لا يوجد دمج بين خطتين منفصلتين في هذا الإصدار).
 * - غير ذلك (مجانية، أو منتهية، أو نفس الخطة): يُطبَّق رمز الخطة الواحدة
 *   مباشرة، مع تمديد ما تبقّى من مدة سارية إن وُجدت.
 */
export async function redeemActivationCodeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();

  const parsed = redeemSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const normalizedCode = parsed.data.code.toUpperCase();

  const activationCode = await prisma.activationCode.findUnique({
    where: { code: normalizedCode },
    include: { planType: { select: { nameAr: true } } },
  });

  if (!activationCode) {
    return { error: "رمز الاشتراك غير موجود" };
  }
  if (activationCode.used) {
    return { error: "رمز الاشتراك مُستخدم مسبقًا" };
  }

  const school = await prisma.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: {
      subscriptionTier: true,
      subscriptionScope: true,
      subscriptionExpiresAt: true,
      subscriptionPlanTypeId: true,
      subscriptionPlanType: { select: { nameAr: true } },
    },
  });

  const currentlyValid = isPaidPlan(school);
  const currentlyFull = currentlyValid && school.subscriptionScope === "ALL";
  const currentlySingleOther =
    currentlyValid &&
    school.subscriptionScope === "SINGLE_PLAN" &&
    school.subscriptionPlanTypeId !== activationCode.planTypeId;

  // رمز خطة واحدة يتعارض مع اشتراك خطة واحدة أخرى سارٍ — رفض واضح، لا استبدال صامت
  if (activationCode.planTypeId && currentlySingleOther) {
    return {
      error: `لديك اشتراك سارٍ بخطة أخرى (${school.subscriptionPlanType?.nameAr ?? "خطة أخرى"}) بالفعل — للاشتراك في أكثر من خطة محددة، فعّل الاشتراك الشامل بدلًا من ذلك.`,
    };
  }

  const base = currentlyValid && school.subscriptionExpiresAt ? school.subscriptionExpiresAt : new Date();
  const newExpiresAt = addMonths(base, activationCode.durationMonths);

  // الترقية لا تُنقص أبدًا: اشتراك شامل قائم، أو رمز شامل جديد، يبقيان الاشتراك شاملًا
  const newScope = currentlyFull || !activationCode.planTypeId ? "ALL" : "SINGLE_PLAN";
  const newPlanTypeId = newScope === "ALL" ? null : activationCode.planTypeId;

  await prisma.$transaction([
    prisma.activationCode.update({
      where: { id: activationCode.id },
      data: { used: true, usedAt: new Date(), schoolId },
    }),
    prisma.school.update({
      where: { id: schoolId },
      data: {
        subscriptionTier: "PAID",
        subscriptionScope: newScope,
        subscriptionPlanTypeId: newPlanTypeId,
        subscriptionExpiresAt: newExpiresAt,
      },
    }),
  ]);

  redirect("/subscription?upgraded=1");
}
