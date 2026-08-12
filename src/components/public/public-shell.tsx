export function PublicShell({
  schoolName,
  title,
  subtitle,
  children,
}: {
  schoolName: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg text-accent-ink">
            🏫
          </span>
          <div>
            <p className="text-sm font-bold text-ink">{schoolName}</p>
            <p className="text-xs text-muted">منصة الخطة التشغيلية</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
      </main>

      <footer className="py-8 text-center text-xs text-muted">
        منصة الخطة التشغيلية — رابط عام لا يتطلب تسجيل دخول
      </footer>
    </div>
  );
}
