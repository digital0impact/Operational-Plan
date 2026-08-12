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
import {
  BUILDING_INDEPENDENCE_OPTIONS,
  INITIATIVE_TYPES,
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
  findLabel,
} from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const school = await getSchoolByShareToken(token);
  return { title: school ? `الخطة التشغيلية — ${school.name}` : "رابط غير صالح" };
}

function SwotBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-bold text-ink">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">لا توجد بنود</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-ink">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">بيانات المدرسة</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
            <dt className="text-muted">نوع المدرسة</dt>
            <dd className="text-ink">{findLabel(SCHOOL_GENDER_OPTIONS, school.gender)}</dd>
            <dt className="text-muted">التصنيف</dt>
            <dd className="text-ink">
              {findLabel(SCHOOL_CLASSIFICATION_OPTIONS, school.schoolSystem)}
            </dd>
            <dt className="text-muted">المرحلة</dt>
            <dd className="text-ink">{findLabel(SCHOOL_STAGE_OPTIONS, school.unit)}</dd>
            <dt className="text-muted">استقلالية المبنى</dt>
            <dd className="text-ink">
              {findLabel(BUILDING_INDEPENDENCE_OPTIONS, school.buildingIndependence)}
            </dd>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">
            الأهداف التشغيلية ومؤشرات الأداء
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-right text-xs text-muted">
                  <th className="py-1.5 pl-2">م</th>
                  <th className="py-1.5 pl-2">الهدف التشغيلي</th>
                  <th className="py-1.5 pl-2">المؤشر</th>
                  <th className="py-1.5">القيمة المستهدفة</th>
                </tr>
              </thead>
              <tbody>
                {operationalGoals.map((g) => (
                  <tr key={g.id} className="border-b border-border last:border-0">
                    <td className="py-2 pl-2 text-muted">{g.strategicGoal.order}</td>
                    <td className="py-2 pl-2 text-ink">{g.text || "—"}</td>
                    <td className="py-2 pl-2 text-ink">{g.kpi?.indicator || "—"}</td>
                    <td className="py-2 text-ink">{g.kpi?.targetValue || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <SwotBox title="نقاط القوة" items={swot.STRENGTH} />
          <SwotBox title="نقاط الضعف" items={swot.WEAKNESS} />
          <SwotBox title="الفرص" items={swot.OPPORTUNITY} />
          <SwotBox title="التهديدات" items={swot.THREAT} />
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-bold text-ink">القضايا الرئيسية</h2>
          {keyIssues.length === 0 ? (
            <p className="text-sm text-muted">لم تُحدَّد قضايا رئيسية</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {keyIssues.map((issue, i) => (
                <li key={i} className="text-sm text-ink">
                  {i + 1}. {issue}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">المبادرات والبرامج</h2>
          <div className="flex flex-col gap-4">
            {operationalGoals.map((g) =>
              g.initiatives.length === 0 ? null : (
                <div key={g.id}>
                  <p className="mb-1.5 text-xs font-semibold text-muted">
                    {g.strategicGoal.order}. {g.text || g.strategicGoal.title}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {g.initiatives.map((initiative) => (
                      <span
                        key={initiative.id}
                        className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-ink"
                      >
                        <span className="text-accent">
                          {INITIATIVE_TYPES[
                            initiative.type as "INITIATIVE" | "PROGRAM"
                          ]?.label}
                        </span>{" "}
                        · {initiative.name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

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
