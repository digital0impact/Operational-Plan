import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

  return (
    <AuthShell active="login">
      {reset ? (
        <p className="mb-4 rounded-lg border border-accent/30 bg-accent-soft px-3.5 py-2.5 text-sm font-semibold text-accent">
          تم تحديث كلمة المرور بنجاح — سجّل الدخول بكلمة المرور الجديدة ✓
        </p>
      ) : null}
      <LoginForm />
    </AuthShell>
  );
}
