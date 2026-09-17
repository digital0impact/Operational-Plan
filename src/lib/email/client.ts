import "server-only";
import { Resend } from "resend";

/** هل خدمة إرسال البريد مضبوطة في بيئة هذا الخادم؟ */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

let cachedClient: Resend | null = null;

/** يُعيد عميل Resend جاهزًا، أو null إن لم يُضبط RESEND_API_KEY. */
export function getEmailClient(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!cachedClient) {
    cachedClient = new Resend(process.env.RESEND_API_KEY);
  }
  return cachedClient;
}

/** عنوان المرسِل — يُضبط عبر EMAIL_FROM بعد التحقّق من نطاق في Resend،
 * وإلا يُستخدم نطاق Resend التجريبي (onboarding@resend.dev) الذي يعمل
 * فقط للإرسال لعنوان حساب Resend نفسه، لا لمستخدمين حقيقيين. */
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "التخطيط الذكي <onboarding@resend.dev>";
