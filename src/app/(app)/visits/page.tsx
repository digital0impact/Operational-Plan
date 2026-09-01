import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getVisitsForSchool } from "@/lib/visits-data";
import { hasFullAccess } from "@/lib/subscription";
import { ScheduleVisitForm } from "@/components/visits/schedule-visit-form";
import { VisitsList } from "@/components/visits/visits-list";

export const metadata: Metadata = { title: "الزيارات الصفية" };

export default async function VisitsPage() {
  const user = await getCurrentUser();
  const school = user!.school!;
  const paid = hasFullAccess(school);
  const visits = await getVisitsForSchool(school.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">الزيارات الصفية</h1>
        <p className="mt-1 text-muted">
          جدول زيارة صفية لمعلم/ة، وشارك معه رابط الرد ليؤكّد الزيارة أو
          يطلب إعادة جدولتها — بلا تسجيل دخول.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-bold text-ink">جدولة زيارة جديدة</h2>
        {paid ? (
          <ScheduleVisitForm />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-surface-2 p-4 text-center">
            <p className="text-sm text-ink">
              🔒 جدولة الزيارات الصفية متاحة فقط مع الاشتراك الشامل
            </p>
            <Link
              href="/subscription"
              className="mt-2 inline-block text-sm font-semibold text-accent hover:underline"
            >
              الترقية إلى الاشتراك الشامل ←
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-bold text-ink">
          الزيارات المجدولة ({visits.length})
        </h2>
        <VisitsList visits={visits} />
      </section>
    </div>
  );
}
