"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSchoolId } from "@/lib/auth-guards";
import { addMonths } from "@/lib/subscription";
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
 * حسابها إلى خطة مدفوعة. الترقية تمدّد تاريخ الانتهاء الحالي إن وُجد (بدل
 * استبداله)، بحيث تُضاف مدة أي رمز جديد إلى ما تبقّى من اشتراك سارٍ.
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
  });

  if (!activationCode) {
    return { error: "رمز الاشتراك غير موجود" };
  }
  if (activationCode.used) {
    return { error: "رمز الاشتراك مُستخدم مسبقًا" };
  }

  await prisma.$transaction(async (tx) => {
    const school = await tx.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { subscriptionExpiresAt: true, subscriptionTier: true },
    });

    const base =
      school.subscriptionTier === "PAID" &&
      school.subscriptionExpiresAt &&
      school.subscriptionExpiresAt.getTime() > Date.now()
        ? school.subscriptionExpiresAt
        : new Date();

    await tx.activationCode.update({
      where: { id: activationCode.id },
      data: { used: true, usedAt: new Date(), schoolId },
    });

    await tx.school.update({
      where: { id: schoolId },
      data: {
        subscriptionTier: "PAID",
        subscriptionExpiresAt: addMonths(base, activationCode.durationMonths),
      },
    });
  });

  redirect("/subscription?upgraded=1");
}
