import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "نسيت كلمة المرور" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl text-accent-ink">
            🏫
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-ink">التخطيط الذكي</h1>
            <p className="mt-1 text-sm text-muted">نسيت كلمة المرور؟</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {sent ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm leading-relaxed text-ink">
                إن كان بريدك مسجَّلًا لدينا، ستصلك رسالة خلال دقائق تحتوي
                رابط إعادة التعيين (تحقّق من مجلد الرسائل غير المرغوب فيها
                إن لم تصل).
              </p>
              <p className="text-xs text-muted">
                الرابط صالح لمرة واحدة ولمدة 24 ساعة فقط.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">
                أدخل بريدك الإلكتروني المسجَّل، وسنرسل لك رابط إعادة تعيين
                كلمة المرور.
              </p>
              <ForgotPasswordForm />
              <p className="text-center text-xs text-muted">
                لم تصلك الرسالة؟ تواصل مع الإدارة العامة للتعليم لإعادة
                التعيين يدويًا.
              </p>
            </>
          )}
          <Link
            href="/login"
            className="mx-auto inline-block text-sm font-semibold text-accent hover:underline"
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
