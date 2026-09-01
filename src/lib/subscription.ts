import "server-only";
import { prisma } from "@/lib/db";

/** أقصى عدد حسابات (مدير + أعضاء فريق) للمدرسة الواحدة على الاشتراك الشامل. */
export const MAX_TEAM_SEATS = 4;

/** أي حقول من المدرسة تكفي لتحديد حالة اشتراكها ونطاقه. */
export type SubscriptionInfo = {
  subscriptionTier: string;
  subscriptionScope: string | null;
  subscriptionExpiresAt: Date | null;
  subscriptionPlanTypeId: string | null;
};

/** رسالة موحّدة تُعرض حيثما حاولت مدرسة مجانية (أو خارج نطاق اشتراكها) استخدام ميزة مدفوعة. */
export const PAYWALL_MESSAGE =
  "هذه الميزة متاحة فقط في الخطط المدفوعة — قم بالترقية من صفحة الاشتراك.";

/** رسالة تُعرض حين تكون المدرسة مشتركة، لكن بخطة أخرى غير التي تحاول استخدامها. */
export const WRONG_PLAN_SCOPE_MESSAGE =
  "اشتراكك الحالي مقتصر على خطة أخرى — قم بالترقية إلى الاشتراك الشامل من صفحة الاشتراك للوصول لهذه الميزة.";

/**
 * هل المدرسة على خطة مدفوعة سارية (بغضّ النظر عن النطاق)؟ الخطة المدفوعة
 * بلا تاريخ انتهاء (subscriptionExpiresAt = null) تُعتبر سارية دائمًا؛ إن
 * حُدِّد تاريخ انتهاء، يجب ألا يكون قد مضى.
 */
export function isPaidPlan(school: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
}): boolean {
  if (school.subscriptionTier !== "PAID") return false;
  if (school.subscriptionExpiresAt && school.subscriptionExpiresAt.getTime() < Date.now()) {
    return false;
  }
  return true;
}

/** هل اشتراك المدرسة شامل لكل أنواع الخطط (لا مقتصر على خطة واحدة)؟ تُستخدم
 * للمزايا التي لا تتبع نوع خطة محدَّد، كالزيارات الصفية والفريق. */
export function hasFullAccess(school: SubscriptionInfo): boolean {
  return isPaidPlan(school) && school.subscriptionScope === "ALL";
}

/** هل تملك المدرسة وصولًا مدفوعًا لنوع خطة بعينه؟ صحيح إن كان اشتراكها
 * شاملًا، أو مقتصرًا على هذا النوع تحديدًا. */
export function canAccessPlanType(school: SubscriptionInfo, planTypeId: string): boolean {
  if (!isPaidPlan(school)) return false;
  if (school.subscriptionScope === "ALL") return true;
  return school.subscriptionPlanTypeId === planTypeId;
}

/** يجلب حالة اشتراك مدرسة من معرّفها فقط (حين لا تتوفر بيانات المدرسة كاملة أصلًا). */
async function getSchoolSubscriptionInfo(schoolId: string): Promise<SubscriptionInfo | null> {
  return prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      subscriptionTier: true,
      subscriptionScope: true,
      subscriptionExpiresAt: true,
      subscriptionPlanTypeId: true,
    },
  });
}

/** نسخة isPaidPlan التي تجلب البيانات من قاعدة البيانات مباشرة بمعرّف المدرسة. */
export async function isSchoolPaid(schoolId: string): Promise<boolean> {
  const school = await getSchoolSubscriptionInfo(schoolId);
  if (!school) return false;
  return isPaidPlan(school);
}

/** نسخة canAccessPlanType التي تجلب البيانات من قاعدة البيانات مباشرة بمعرّف المدرسة. */
export async function schoolCanAccessPlanType(
  schoolId: string,
  planTypeId: string
): Promise<boolean> {
  const school = await getSchoolSubscriptionInfo(schoolId);
  if (!school) return false;
  return canAccessPlanType(school, planTypeId);
}

/** نسخة hasFullAccess التي تجلب البيانات من قاعدة البيانات مباشرة بمعرّف المدرسة. */
export async function schoolHasFullAccess(schoolId: string): Promise<boolean> {
  const school = await getSchoolSubscriptionInfo(schoolId);
  if (!school) return false;
  return hasFullAccess(school);
}

/** معرّف نوع خطة من مفتاحه الثابت (مثل "operational") — تُستخدم لبوابات
 * التحقّق حيث لا يتوفر planId مباشرة (خطة المعالج القديمة). */
export async function getPlanTypeIdByKey(key: string): Promise<string | null> {
  const planType = await prisma.planType.findUnique({ where: { key }, select: { id: true } });
  return planType?.id ?? null;
}

/** يضيف عدد أشهر إلى تاريخ (يُستخدم لحساب تاريخ انتهاء الاشتراك بعد الترقية). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
