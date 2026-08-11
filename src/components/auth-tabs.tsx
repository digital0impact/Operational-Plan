import Link from "next/link";

export function AuthTabs({ active }: { active: "register" | "login" }) {
  const tabs = [
    { href: "/register", key: "register", label: "تسجيل مدرسة جديدة" },
    { href: "/login", key: "login", label: "تسجيل الدخول" },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-2 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={
            "rounded-md py-2 text-center text-sm font-semibold transition " +
            (tab.key === active
              ? "bg-surface text-accent shadow-sm"
              : "text-muted hover:text-ink")
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
