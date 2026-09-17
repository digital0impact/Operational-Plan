import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "نسيت كلمة المرور" };

export default function ForgotPasswordPage() {
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

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <p className="text-sm leading-relaxed text-ink">
            لإعادة تعيين كلمة المرور، تواصل مع الإدارة العامة للتعليم
            (الجهة المسؤولة عن حسابك) لتأكيد هويتك.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            بعد التأكد من هويتك، سيصلك رابط إعادة تعيين صالح لمرة واحدة
            ولمدة 24 ساعة عبر نفس القناة التي تواصلت بها معها.
          </p>
          <Link
            href="/login"
            className="mx-auto mt-2 inline-block rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
