import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVisitByToken } from "@/lib/visits-data";
import { respondVisitAction } from "@/app/actions/visits";
import { PublicShell } from "@/components/public/public-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const visit = await getVisitByToken(token);
  return { title: visit ? `زيارة صفية — ${visit.school.name}` : "رابط غير صالح" };
}

const dateFormatter = new Intl.DateTimeFormat("ar", {
  dateStyle: "full",
  timeStyle: "short",
});

export default async function VisitResponsePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const visit = await getVisitByToken(token);
  if (!visit) notFound();

  const action = respondVisitAction.bind(null, token);

  return (
    <PublicShell
      schoolName={visit.school.name}
      title="زيارة صفية مجدولة"
      subtitle="راجع تفاصيل الزيارة أدناه، ثم أكّدها أو اطلب إعادة جدولتها."
    >
      <div className="rounded-xl border border-border bg-surface p-5">
        <dl className="grid gap-y-2.5 text-sm sm:grid-cols-2">
          <dt className="text-muted">المعلم/ة</dt>
          <dd className="text-ink">{visit.teacherName}</dd>
          {visit.subject ? (
            <>
              <dt className="text-muted">المادة</dt>
              <dd className="text-ink">{visit.subject}</dd>
            </>
          ) : null}
          {visit.className ? (
            <>
              <dt className="text-muted">الصف/الشعبة</dt>
              <dd className="text-ink">{visit.className}</dd>
            </>
          ) : null}
          <dt className="text-muted">الموعد المقترح</dt>
          <dd className="text-ink">{dateFormatter.format(visit.scheduledAt)}</dd>
        </dl>
        {visit.purpose ? (
          <p className="mt-4 rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm text-ink">
            {visit.purpose}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        {visit.status === "SCHEDULED" ? (
          <form action={action} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">
                ملاحظة (اختياري — خصوصًا عند طلب إعادة الجدولة)
              </span>
              <textarea
                name="note"
                rows={2}
                placeholder="مثال: أفضّل موعدًا بعد الحصة الثالثة"
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                name="decision"
                value="confirm"
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90"
              >
                تأكيد الزيارة ✓
              </button>
              <button
                type="submit"
                name="decision"
                value="reschedule"
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
              >
                طلب إعادة جدولة
              </button>
            </div>
          </form>
        ) : (
          <div
            className={
              "rounded-xl px-4 py-3.5 text-center text-sm font-semibold " +
              (visit.status === "CONFIRMED"
                ? "bg-accent-soft text-accent"
                : "bg-danger-soft text-danger")
            }
          >
            {visit.status === "CONFIRMED"
              ? "تم تأكيد الزيارة ✓ — شكرًا لك."
              : "تم إرسال طلب إعادة الجدولة — سيتواصل معك مدير المدرسة لتحديد موعد جديد."}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
