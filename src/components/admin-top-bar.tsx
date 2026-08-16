import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export function AdminTopBar({ userName }: { userName: string }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg text-accent-ink">
              🏫
            </span>
            <span className="hidden text-sm font-bold text-ink sm:block">
              لوحة الإدارة العامة
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-ink hover:text-accent">
              نظرة عامة
            </Link>
            <Link href="/admin/codes" className="text-ink hover:text-accent">
              رموز التفعيل
            </Link>
            <Link href="/admin/plan-types" className="text-ink hover:text-accent">
              أنواع الخطط
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted sm:block">{userName}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:border-danger hover:text-danger"
            >
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
