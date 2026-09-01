import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { USER_ROLE_LABELS } from "@/lib/constants";

export function TopBar({
  schoolName,
  userName,
  role,
  isPaid,
}: {
  schoolName: string;
  userName: string;
  role: string;
  isPaid?: boolean;
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg text-accent-ink">
              🏫
            </span>
            <span className="hidden text-sm font-bold text-ink sm:block">
              التخطيط الذكي
            </span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            <Link href="/dashboard" className="text-ink hover:text-accent">
              الرئيسية
            </Link>
            <Link href="/visits" className="text-ink hover:text-accent">
              الزيارات الصفية
            </Link>
            <Link href="/subscription" className="flex items-center gap-1.5 text-ink hover:text-accent">
              الاشتراك
              {!isPaid ? (
                <span className="rounded-full bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber">
                  مجاني
                </span>
              ) : null}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-sm font-semibold text-ink">{schoolName}</p>
            <p className="text-xs text-muted">
              {userName} · {USER_ROLE_LABELS[role] ?? role}
            </p>
          </div>
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
