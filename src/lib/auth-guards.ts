import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

/**
 * يتحقق أن هناك مستخدمًا مسجَّل الدخول تابعًا لمدرسة، ويُعيد معرّف مدرسته.
 * غير ذلك يُعيد التوجيه لصفحة الدخول. مُشترَك بين كل Server Actions التي
 * تعمل ضمن نطاق مدرسة واحدة (المعالج، الزيارات الصفية...).
 */
export async function requireSchoolId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.schoolId) {
    redirect("/login");
  }
  return user.schoolId;
}

/**
 * يتحقق أن المستخدم الحالي هو الإدارة العامة للتعليم (`GENERAL_ADMIN`)،
 * ويُعيد المستخدم نفسه. غير ذلك يُعيد التوجيه لصفحة الدخول. مُشترَك بين
 * كل Server Actions الخاصة بلوحة الإدارة.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "GENERAL_ADMIN") {
    redirect("/login");
  }
  return user;
}
