import { AuthTabs } from "@/components/auth-tabs";

export function AuthShell({
  active,
  children,
}: {
  active: "register" | "login";
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl text-accent-ink">
            🏫
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-ink">
              التخطيط الذكي
            </h1>
            <p className="mt-1 text-sm text-muted">بوابة الدخول الموحدة</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <AuthTabs active={active} />
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          © 2026 التخطيط الذكي. جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
