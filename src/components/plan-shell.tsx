import Link from "next/link";

export function PlanShell({
  planId,
  planTypeName,
  academicYear,
  sections,
  currentSectionKey,
  completedKeys,
  children,
}: {
  planId: string;
  planTypeName: string;
  academicYear: string;
  sections: { key: string; order: number; titleAr: string }[];
  currentSectionKey: string;
  completedKeys: Set<string>;
  children: React.ReactNode;
}) {
  const currentIndex = sections.findIndex((s) => s.key === currentSectionKey);
  const current = sections[currentIndex];
  const previous = sections[currentIndex - 1];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
          ← العودة للرئيسية
        </Link>
        {previous ? (
          <Link
            href={`/plans/${planId}/${previous.key}`}
            className="text-sm text-muted hover:text-accent"
          >
            القسم السابق →
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1.5">
          {sections.map((section) => {
            const isCurrent = section.key === currentSectionKey;
            const isDone = completedKeys.has(section.key);
            return (
              <div
                key={section.key}
                className={
                  "flex-1 min-w-[110px] rounded-lg border px-2.5 py-2 text-center text-xs transition " +
                  (isCurrent
                    ? "border-accent bg-accent-soft font-semibold text-accent"
                    : isDone
                      ? "border-border bg-surface-2 text-muted"
                      : "border-dashed border-border text-muted")
                }
              >
                {section.titleAr}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="font-mono text-xs text-muted">
          {planTypeName} · {academicYear} · القسم {currentIndex + 1} من {sections.length}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink">{current?.titleAr}</h1>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">{children}</div>
    </div>
  );
}
