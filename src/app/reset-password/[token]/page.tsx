import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "إعادة تعيين كلمة المرور" };

export const dynamic = "force-dynamic";

function isTokenValid(resetToken: { usedAt: Date | null; expiresAt: Date } | null): boolean {
  if (!resetToken || resetToken.usedAt) return false;
  return resetToken.expiresAt.getTime() > Date.now();
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  const valid = isTokenValid(resetToken);

  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl text-accent-ink">
            🏫
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-ink">التخطيط الذكي</h1>
            <p className="mt-1 text-sm text-muted">إعادة تعيين كلمة المرور</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {valid ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-ink">
                رابط إعادة التعيين غير صالح أو منتهي الصلاحية — روابط إعادة
                التعيين صالحة لمرة واحدة ولمدة 24 ساعة فقط.
              </p>
              <p className="text-sm text-muted">
                تواصل مع الإدارة العامة للتعليم لإصدار رابط جديد.
              </p>
              <Link
                href="/login"
                className="mx-auto inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90"
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
