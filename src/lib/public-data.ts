import "server-only";
import { prisma } from "@/lib/db";

export async function getSchoolByVoteToken(token: string) {
  return prisma.school.findUnique({ where: { voteToken: token } });
}

export async function getSchoolByShareToken(token: string) {
  return prisma.school.findUnique({ where: { shareToken: token } });
}

export async function getVotableGoals(schoolId: string) {
  const goals = await prisma.operationalGoal.findMany({
    where: { schoolId },
    include: {
      strategicGoal: true,
      initiatives: {
        include: { votes: true },
        orderBy: { order: "asc" },
      },
    },
  });
  return goals.sort((a, b) => a.strategicGoal.order - b.strategicGoal.order);
}

export async function getEvaluationSummary(schoolId: string) {
  const evaluations = await prisma.evaluation.findMany({ where: { schoolId } });
  const count = evaluations.length;
  const average =
    count === 0
      ? null
      : evaluations.reduce((sum, e) => sum + e.rating, 0) / count;
  return { count, average };
}
