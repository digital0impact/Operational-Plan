import "server-only";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";

/** يرسل رسالة إعادة تعيين كلمة المرور، أو يُعيد false بصمت إن لم تكن
 * خدمة البريد مضبوطة أو تعذّر الإرسال — لا يرمي استثناء أبدًا، حتى لا
 * يفشل مسار "نسيت كلمة المرور" العام بخطأ يكشف تفاصيل داخلية. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const client = getEmailClient();
  if (!client) return false;

  try {
    const { error } = await client.emails.send({
      from: EMAIL_FROM,
      to,
      subject: "إعادة تعيين كلمة المرور — التخطيط الذكي",
      html: `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #0f766e;">إعادة تعيين كلمة المرور</h2>
          <p>وصلنا طلب لإعادة تعيين كلمة مرور حسابك في منصة التخطيط الذكي.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; background: #0f766e; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              تعيين كلمة مرور جديدة
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">
            هذا الرابط صالح لمدة 24 ساعة ولاستخدام واحد فقط. إن لم تطلب
            إعادة التعيين، يمكنك تجاهل هذه الرسالة بأمان.
          </p>
        </div>
      `,
    });
    return !error;
  } catch {
    return false;
  }
}
