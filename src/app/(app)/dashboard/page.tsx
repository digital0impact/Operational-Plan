import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getCompletedSteps } from "@/lib/wizard-data";
import { getEvaluationSummary } from "@/lib/public-data";
import { CopyLink } from "@/components/copy-link";
import {
  TOTAL_WIZARD_STEPS,
  WIZARD_STAGES,
  WIZARD_STEP_TITLES,
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

  const [completedSteps, totalVotes, evaluations, evalSummary] = await Promise.all([
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
          تابع إعداد الخطة التشغيلية لمدرسة {school.name} من هنا.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">
              نسبة إنجاز الخطة التشغيلية
            </h2>
            <p className="mt-1 text-sm text-muted">
              {completedCount} من {TOTAL_WIZARD_STEPS} خطوة
            </p>
          </div>
          <div className="flex items-center gap-2">
            {completedCount > 0 ? (
              <a
                href="/export"
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
              >
                تصدير PDF
              </a>
            ) : null}
            {isPlanComplete ? (
              <span className="rounded-lg bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent">
                الخطة مكتملة ✓
              </span>
            ) : (
              <Link
                href={`/wizard/${continueStep}`}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90"
              >
                {completedCount === 0 ? "ابدأ إعداد الخطة" : "متابعة الخطة"}
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-muted">{progressPercent}%</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {WIZARD_STAGES.map((stage) => {
            const stageDone = Array.from(
              { length: stage.to - stage.from + 1 },
              (_, i) => stage.from + i
            ).every((step) => completedSteps.has(step));
            return (
              <span
                key={stage.key}
                className={
                  "rounded-full border px-3 py-1 text-xs " +
                  (stageDone
                    ? "border-accent/30 bg-accent-soft text-accent"
                    : "border-border bg-surface-2 text-muted")
                }
              >
                {stageDone ? "✓ " : ""}
                {stage.label} · {stage.from}–{stage.to}
              </span>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-ink">بيانات المدرسة</h2>
          <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
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
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-ink">خطوات المعالج</h2>
          <ul className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto">
            {Object.entries(WIZARD_STEP_TITLES).map(([step, title]) => {
              const stepNumber = Number(step);
              const done = completedSteps.has(stepNumber);
              const isNext = stepNumber === continueStep && !done;
              return (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span
                    className={
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold " +
                      (done
                        ? "bg-accent text-accent-ink"
                        : "border border-border text-muted")
                    }
                  >
                    {done ? "✓" : step}
                  </span>
                  <Link
                    href={`/wizard/${step}`}
                    className={
                      "flex-1 " +
                      (isNext ? "font-semibold text-accent" : "text-ink")
                    }
                  >
                    {title}
                    {stepNumber >= 16 ? ` — هدف ${stepNumber - 15}` : ""}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-bold text-ink">روابط عامة بلا تسجيل دخول</h2>
        <p className="mt-1 text-sm text-muted">
          شارك هذه الروابط مع المعلمين لتصويتهم على المبادرات والبرامج، ومع
          المشرف التربوي أو أولياء الأمور للاطلاع على الخطة وتقييمها.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CopyLink path={`/vote/${school.voteToken}`} label={`رابط التصويت (${totalVotes} صوت)`} />
          <CopyLink path={`/share/${school.shareToken}`} label="رابط المشاركة والتقييم" />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
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
      </section>
    </div>
  );
}
