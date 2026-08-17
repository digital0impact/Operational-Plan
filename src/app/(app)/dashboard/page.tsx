import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getCompletedSteps } from "@/lib/wizard-data";
import { getEvaluationSummary } from "@/lib/public-data";
import { getSchoolPlans } from "@/lib/plan-data";
import { CopyLink } from "@/components/copy-link";
import {
  TOTAL_WIZARD_STEPS,
  REVIEWER_ROLE_LABELS,
  findLabel,
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
} from "@/lib/constants";

export const metadata: Metadata = { title: "الرئيسية" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const school = user!.school!;

  const [completedSteps, totalVotes, evaluations, evalSummary, otherPlans] = await Promise.all([
    getCompletedSteps(school.id),
    prisma.vote.count({
      where: { initiative: { operationalGoal: { schoolId: school.id } } },
    }),
    prisma.evaluation.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    getEvaluationSummary(school.id),
    getSchoolPlans(school.id),
  ]);
  const completedCount = completedSteps.size;
  const progressPercent = Math.round((completedCount / TOTAL_WIZARD_STEPS) * 100);
  const isPlanComplete = completedCount >= TOTAL_WIZARD_STEPS;
  const continueStep = Math.min(school.currentStep, TOTAL_WIZARD_STEPS);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">
          مرحبًا، {user!.name} 👋
        </h1>
        <p className="mt-1 text-muted">
          كل خطط مدرسة {school.name} في مكان واحد.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-bold text-ink">بيانات المدرسة</h2>
        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-4">
          <dt className="text-muted">اسم المدرسة</dt>
          <dd className="text-ink">{school.name}</dd>
          <dt className="text-muted">نوع المدرسة</dt>
          <dd className="text-ink">
            {findLabel(SCHOOL_GENDER_OPTIONS, school.gender)}
          </dd>
          <dt className="text-muted">تصنيف المدرسة</dt>
          <dd className="text-ink">
            {findLabel(SCHOOL_CLASSIFICATION_OPTIONS, school.schoolSystem)}
          </dd>
          <dt className="text-muted">المرحلة الدراسية</dt>
          <dd className="text-ink">
            {findLabel(SCHOOL_STAGE_OPTIONS, school.unit)}
          </dd>
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">كل الخطط</h2>
          <Link
            href="/plans/new"
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
          >
            + إنشاء خطة جديدة
          </Link>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          <li className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">الخطة التشغيلية</p>
                <p className="mt-1 text-xs text-muted">
                  {completedCount} من {TOTAL_WIZARD_STEPS} خطوة · {progressPercent}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                {completedCount > 0 ? (
                  <a
                    href="/export"
                    className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
                  >
                    تصدير PDF
                  </a>
                ) : null}
                {isPlanComplete ? (
                  <span className="rounded-lg bg-accent-soft px-3.5 py-2 text-xs font-semibold text-accent">
                    مكتملة ✓
                  </span>
                ) : (
                  <Link
                    href={`/wizard/${continueStep}`}
                    className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-ink transition hover:opacity-90"
                  >
                    {completedCount === 0 ? "ابدأ" : "متابعة"}
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </li>

          {otherPlans.map((plan) => (
            <li
              key={plan.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-ink">
                  {plan.planTypeName}{" "}
                  <span className="font-normal text-muted">· {plan.academicYear}</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {plan.completedSections} من {plan.totalSections} أقسام ·{" "}
                  {plan.progressPercent}%
                </p>
              </div>
              {plan.status === "COMPLETE" ? (
                <span className="rounded-lg bg-accent-soft px-3.5 py-2 text-xs font-semibold text-accent">
                  مكتملة ✓
                </span>
              ) : (
                <Link
                  href={`/plans/${plan.id}/${plan.nextSectionKey}`}
                  className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-ink transition hover:opacity-90"
                >
                  متابعة
                </Link>
              )}
            </li>
          ))}
        </ul>

        {otherPlans.length === 0 ? (
          <p className="mt-3 text-xs text-muted">
            يمكنك إنشاء أنواع خطط أخرى (كخطة النشاط الطلابي أو رعاية الموهوبين)
            من زر «إنشاء خطة جديدة» أعلاه.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div>
          <h2 className="text-base font-bold text-ink">روابط عامة بلا تسجيل دخول</h2>
          <p className="mt-1 text-sm text-muted">
            شارك هذه الروابط مع المعلمين لتصويتهم على المبادرات والبرامج، ومع
            المشرف التربوي أو أولياء الأمور للاطلاع على الخطة وتقييمها.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CopyLink path={`/vote/${school.voteToken}`} label={`رابط التصويت (${totalVotes} صوت)`} />
            <CopyLink path={`/share/${school.shareToken}`} label="رابط المشاركة والتقييم" />
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">التقييمات الواردة</h2>
            {evalSummary.count > 0 ? (
              <span className="text-sm text-muted">
                ⭐ {evalSummary.average!.toFixed(1)} من 5 · {evalSummary.count} تقييم
              </span>
            ) : null}
          </div>

          {evaluations.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              لا توجد تقييمات بعد — شارك رابط المشاركة والتقييم لتصل إليك الآراء هنا.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {evaluations.map((evaluation) => (
                <li
                  key={evaluation.id}
                  className="rounded-lg border border-border bg-surface-2 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {evaluation.reviewerName}{" "}
                      <span className="font-normal text-muted">
                        · {REVIEWER_ROLE_LABELS[evaluation.reviewerRole] ?? evaluation.reviewerRole}
                      </span>
                    </p>
                    <span className="shrink-0 font-mono text-xs text-accent">
                      ⭐ {evaluation.rating}/5
                    </span>
                  </div>
                  {evaluation.comment ? (
                    <p className="mt-1.5 text-sm text-ink">{evaluation.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
