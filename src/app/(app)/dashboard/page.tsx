import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import {
  IMPLEMENTED_WIZARD_STEPS,
  TOTAL_WIZARD_STEPS,
  WIZARD_STAGES,
  WIZARD_STEP_TITLES,
  findLabel,
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
} from "@/lib/constants";

export const metadata: Metadata = { title: "الرئيسية" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const school = user!.school!;

  const completedSteps = [
    school.step1CompletedAt,
    school.step2CompletedAt,
    school.step3CompletedAt,
    school.step4CompletedAt,
  ].filter(Boolean).length;

  const progressPercent = Math.round(
    (completedSteps / TOTAL_WIZARD_STEPS) * 100
  );
  const isWizardDone = completedSteps >= IMPLEMENTED_WIZARD_STEPS;

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
              {completedSteps} من {TOTAL_WIZARD_STEPS} خطوة — الخطوات المتاحة
              حاليًا: {IMPLEMENTED_WIZARD_STEPS}
            </p>
          </div>
          <Link
            href={`/wizard/step-${Math.min(school.currentStep, IMPLEMENTED_WIZARD_STEPS)}`}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90"
          >
            {completedSteps === 0 ? "ابدأ إعداد الخطة" : "متابعة الخطة"}
          </Link>
        </div>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-muted">{progressPercent}%</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {WIZARD_STAGES.map((stage) => (
            <span
              key={stage.key}
              className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted"
            >
              {stage.label} · {stage.from}–{stage.to}
            </span>
          ))}
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
          <ul className="mt-4 flex flex-col gap-2">
            {Object.entries(WIZARD_STEP_TITLES).map(([step, title]) => {
              const stepNumber = Number(step);
              const done = stepNumber <= completedSteps;
              const isNext = stepNumber === completedSteps + 1;
              return (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span
                    className={
                      "flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-bold " +
                      (done
                        ? "bg-accent text-accent-ink"
                        : "border border-border text-muted")
                    }
                  >
                    {done ? "✓" : step}
                  </span>
                  <Link
                    href={`/wizard/step-${step}`}
                    className={
                      "flex-1 " +
                      (isNext ? "font-semibold text-accent" : "text-ink")
                    }
                  >
                    {title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {isWizardDone ? (
        <section className="rounded-2xl border border-accent/30 bg-accent-soft p-6">
          <h2 className="text-base font-bold text-accent">
            الخطوات 5–25 قادمة
          </h2>
          <p className="mt-1 text-sm text-ink/80">
            الارتباط الاستراتيجي، مؤشرات الأداء، تحليل SWOT، القضايا
            والمبادرات، والخطة التفصيلية — في الإصدار التالي من المنصة.
          </p>
        </section>
      ) : null}
    </div>
  );
}
