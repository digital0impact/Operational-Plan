import "server-only";
import { prisma } from "@/lib/db";
import { TOTAL_WIZARD_STEPS } from "@/lib/constants";

export async function getAdminOverview() {
  const [schools, stepCounts, activationCodes, voteCount, evaluations] =
    await Promise.all([
      prisma.school.findMany({
        select: {
          id: true,
          name: true,
          unit: true,
          schoolSystem: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.wizardStepProgress.groupBy({
        by: ["schoolId"],
        _count: { step: true },
      }),
      prisma.activationCode.findMany({
        select: { id: true, used: true },
      }),
      prisma.vote.count(),
      prisma.evaluation.findMany({ select: { rating: true } }),
    ]);

  const completedBySchool = new Map(
    stepCounts.map((row) => [row.schoolId, row._count.step])
  );

  const schoolRows = schools.map((school) => {
    const completed = completedBySchool.get(school.id) ?? 0;
    return {
      ...school,
      completedSteps: completed,
      progressPercent: Math.round((completed / TOTAL_WIZARD_STEPS) * 100),
    };
  });

  const avgProgress =
    schoolRows.length === 0
      ? 0
      : Math.round(
          schoolRows.reduce((sum, s) => sum + s.progressPercent, 0) /
            schoolRows.length
        );

  const avgRating =
    evaluations.length === 0
      ? null
      : evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length;

  return {
    schools: schoolRows,
    stats: {
      totalSchools: schools.length,
      totalCodes: activationCodes.length,
      usedCodes: activationCodes.filter((c) => c.used).length,
      avgProgress,
      totalVotes: voteCount,
      totalEvaluations: evaluations.length,
      avgRating,
    },
  };
}

/**
 * كل أنواع الخطط مع قوالبها وأقسامها — أساس منصة الخطط المتعددة (مرحلة أ).
 * لا تُستهلَك بعد إلا من `/admin/plan-types`.
 */
export async function getPlanTypesOverview() {
  return prisma.planType.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      templates: {
        orderBy: { version: "desc" },
        include: { sections: { orderBy: { order: "asc" } } },
      },
    },
  });
}
