import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  getKeyIssues,
  getOperationalGoals,
  getSwotItems,
  getCompletedSteps,
} from "@/lib/wizard-data";
import { getEvaluationSummary } from "@/lib/public-data";
import { PlanSummary } from "@/components/plan-summary";
import { SchoolUsersList } from "@/components/admin/school-users-list";
import { CopyLink } from "@/components/copy-link";
import { TOTAL_WIZARD_STEPS } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const school = await prisma.school.findUnique({ where: { id } });
  return { title: school ? school.name : "مدرسة غير موجودة" };
}

export default async function AdminSchoolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resetToken?: string; resetUser?: string }>;
}) {
  const { id } = await params;
  const { resetToken, resetUser } = await searchParams;
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) notFound();

  const [operationalGoals, swot, keyIssues, completedSteps, evalSummary, users] =
    await Promise.all([
      getOperationalGoals(school.id),
      getSwotItems(school.id),
      getKeyIssues(school.id),
      getCompletedSteps(school.id),
      getEvaluationSummary(school.id),
      prisma.user.findMany({
        where: { schoolId: school.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, role: true },
      }),
    ]);

  const progressPercent = Math.round(
    (completedSteps.size / TOTAL_WIZARD_STEPS) * 100
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-accent">
          ← العودة لنظرة عامة
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-ink">{school.name}</h1>
        <p className="mt-1 text-muted">
          {completedSteps.size} من {TOTAL_WIZARD_STEPS} خطوة مكتملة ({progressPercent}%)
          {evalSummary.count > 0
            ? ` · ⭐ ${evalSummary.average!.toFixed(1)} من 5 (${evalSummary.count} تقييم)`
            : ""}
        </p>
      </div>

      {resetToken ? (
        <div className="rounded-xl border border-accent/30 bg-accent-soft p-4">
          <p className="mb-2 text-sm font-semibold text-accent">
            رابط إعادة تعيين كلمة المرور لـ{resetUser ?? "المستخدم"} — صالح
            لمرة واحدة ولمدة 24 ساعة. انسخه وسلّمه للمستخدم بعد التحقّق من
            هويته.
          </p>
          <CopyLink path={`/reset-password/${resetToken}`} label="رابط إعادة التعيين" />
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-bold text-ink">المستخدمون</h2>
        <SchoolUsersList schoolId={school.id} users={users} />
      </section>

      <PlanSummary
        school={school}
        operationalGoals={operationalGoals}
        swot={swot}
        keyIssues={keyIssues}
      />
    </div>
  );
}
