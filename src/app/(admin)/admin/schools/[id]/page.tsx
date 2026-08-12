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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) notFound();

  const [operationalGoals, swot, keyIssues, completedSteps, evalSummary] =
    await Promise.all([
      getOperationalGoals(school.id),
      getSwotItems(school.id),
      getKeyIssues(school.id),
      getCompletedSteps(school.id),
      getEvaluationSummary(school.id),
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

      <PlanSummary
        school={school}
        operationalGoals={operationalGoals}
        swot={swot}
        keyIssues={keyIssues}
      />
    </div>
  );
}
