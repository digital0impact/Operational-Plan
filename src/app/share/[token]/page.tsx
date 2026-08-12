import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSchoolByShareToken, getEvaluationSummary } from "@/lib/public-data";
import {
  getKeyIssues,
  getOperationalGoals,
  getSwotItems,
} from "@/lib/wizard-data";
import { submitEvaluationAction } from "@/app/actions/public";
import { PublicShell } from "@/components/public/public-shell";
import { PlanSummary } from "@/components/plan-summary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const school = await getSchoolByShareToken(token);
  return { title: school ? `الخطة التشغيلية — ${school.name}` : "رابط غير صالح" };
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ thanks?: string; error?: string }>;
}) {
  const { token } = await params;
  const { thanks, error } = await searchParams;

  const school = await getSchoolByShareToken(token);
  if (!school) notFound();

  const [operationalGoals, swot, keyIssues, evalSummary] = await Promise.all([
    getOperationalGoals(school.id),
    getSwotItems(school.id),
    getKeyIssues(school.id),
    getEvaluationSummary(school.id),
  ]);

  const action = submitEvaluationAction.bind(null, token);

  return (
    <PublicShell
      schoolName={school.name}
      title="الخطة التشغيلية للمدرسة"
      subtitle="عرض للاطلاع على الخطة التشغيلية ومشاركة رأيك وتقييمك."
    >
      <div className="flex flex-col gap-6">
        {evalSummary.count > 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4">
            <span className="text-xl">⭐</span>
            <p className="text-sm text-ink">
              متوسط التقييم <b>{evalSummary.average!.toFixed(1)}</b> من 5 —
              بناءً على {evalSummary.count} تقييم
            </p>
          </div>
        ) : null}

        <PlanSummary
          school={school}
          operationalGoals={operationalGoals}
          swot={swot}
          keyIssues={keyIssues}
        />

        <a
          href={`/share/${token}/pdf`}
          className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
        >
          تحميل الخطة كاملة (PDF) ↓
        </a>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-base font-bold text-ink">شاركنا رأيك</h2>

          {thanks ? (
            <p className="rounded-lg bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
              شكرًا لك، تم استلام تقييمك بنجاح ✓
            </p>
          ) : (
            <form action={action} className="flex flex-col gap-3">
              {error ? (
                <p className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                  تعذّر إرسال التقييم، تأكد من تعبئة الحقول المطلوبة.
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-ink">اسمك</span>
                  <input
                    name="reviewerName"
                    required
                    minLength={2}
                    className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-ink">صفتك</span>
                  <select
                    name="reviewerRole"
                    defaultValue="SUPERVISOR"
                    className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  >
                    <option value="SUPERVISOR">مشرف تربوي</option>
                    <option value="PARENT">ولي أمر</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink">التقييم</span>
                <select
                  name="rating"
                  defaultValue="5"
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                >
                  <option value="5">ممتاز (5)</option>
                  <option value="4">جيد جدًا (4)</option>
                  <option value="3">جيد (3)</option>
                  <option value="2">مقبول (2)</option>
                  <option value="1">ضعيف (1)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink">ملاحظاتك (اختياري)</span>
                <textarea
                  name="comment"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                />
              </label>

              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90"
              >
                إرسال التقييم
              </button>
            </form>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
