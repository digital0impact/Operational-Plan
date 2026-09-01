import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOverview } from "@/lib/admin-data";
import {
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
  findLabel,
} from "@/lib/constants";

export const metadata: Metadata = { title: "لوحة الإدارة العامة" };

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const { schools, stats } = await getAdminOverview();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">نظرة عامة</h1>
        <p className="mt-1 text-muted">
          متابعة مجمّعة لحالة الخطط التشغيلية في جميع المدارس المسجَّلة.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="عدد المدارس" value={stats.totalSchools} />
        <StatCard
          label="رموز الاشتراك"
          value={`${stats.usedCodes} / ${stats.totalCodes}`}
        />
        <StatCard label="متوسط الإنجاز" value={`${stats.avgProgress}%`} />
        <StatCard
          label="التقييمات"
          value={
            stats.avgRating === null
              ? stats.totalEvaluations
              : `${stats.avgRating.toFixed(1)}⭐ (${stats.totalEvaluations})`
          }
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">المدارس المسجَّلة</h2>
          <Link
            href="/admin/codes"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:opacity-90"
          >
            إصدار رموز اشتراك
          </Link>
        </div>

        {schools.length === 0 ? (
          <p className="mt-4 text-sm text-muted">لا توجد مدارس مسجَّلة بعد.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-right text-xs text-muted">
                  <th className="py-2 pl-2">اسم المدرسة</th>
                  <th className="py-2 pl-2">المرحلة</th>
                  <th className="py-2 pl-2">التصنيف</th>
                  <th className="py-2 pl-2">الإنجاز</th>
                  <th className="py-2 pl-2">الاشتراك</th>
                  <th className="py-2">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pl-2">
                      <Link
                        href={`/admin/schools/${school.id}`}
                        className="font-semibold text-ink hover:text-accent"
                      >
                        {school.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pl-2 text-ink">
                      {findLabel(SCHOOL_STAGE_OPTIONS, school.unit)}
                    </td>
                    <td className="py-2.5 pl-2 text-ink">
                      {findLabel(SCHOOL_CLASSIFICATION_OPTIONS, school.schoolSystem)}
                    </td>
                    <td className="py-2.5 pl-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-semibold " +
                          (school.progressPercent >= 100
                            ? "bg-accent-soft text-accent"
                            : "bg-surface-2 text-muted")
                        }
                      >
                        {school.progressPercent}%
                      </span>
                    </td>
                    <td className="py-2.5 pl-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-semibold " +
                          (school.isPaid
                            ? "bg-accent-soft text-accent"
                            : "bg-surface-2 text-muted")
                        }
                      >
                        {school.isPaid ? "مدفوعة" : "مجانية"}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-xs text-muted">
                      {new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
                        school.createdAt
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
