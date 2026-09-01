import "server-only";
import { prisma } from "@/lib/db";

/** أي حقول من المدرسة تكفي لتحديد حالة اشتراكها. */
export type SubscriptionInfo = {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
};

/** رسالة موحّدة تُعرض حيثما حاولت مدرسة مجانية استخدام ميزة مدفوعة. */
export const PAYWALL_MESSAGE =
  "هذه الميزة متاحة فقط في الخطط المدفوعة — قم بالترقية من صفحة الاشتراك.";

/**
 * هل المدرسة على خطة مدفوعة سارية؟ الخطة المدفوعة بلا تاريخ انتهاء
 * (subscriptionExpiresAt = null) تُعتبر سارية دائمًا؛ إن حُدِّد تاريخ
 * انتهاء، يجب ألا يكون قد مضى.
 */
export function isPaidPlan(school: SubscriptionInfo): boolean {
  if (school.subscriptionTier !== "PAID") return false;
  if (school.subscriptionExpiresAt && school.subscriptionExpiresAt.getTime() < Date.now()) {
    return false;
  }
  return true;
}

/** يجلب حالة اشتراك مدرسة من معرّفها فقط (حين لا تتوفر بيانات المدرسة كاملة أصلًا). */
export async function isSchoolPaid(schoolId: string): Promise<boolean> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true },
  });
  if (!school) return false;
  return isPaidPlan(school);
}

/** يضيف عدد أشهر إلى تاريخ (يُستخدم لحساب تاريخ انتهاء الاشتراك بعد الترقية). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
