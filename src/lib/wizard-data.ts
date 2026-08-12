import "server-only";
import { prisma } from "@/lib/db";

export async function getStrategicGoals() {
  return prisma.strategicGoal.findMany({ orderBy: { order: "asc" } });
}

export async function getOperationalGoals(schoolId: string) {
  const goals = await prisma.operationalGoal.findMany({
    where: { schoolId },
    include: {
      strategicGoal: true,
      kpi: true,
      initiatives: { include: { actionItems: true }, orderBy: { order: "asc" } },
    },
  });
  return goals.sort((a, b) => a.strategicGoal.order - b.strategicGoal.order);
}

export async function getSwotItems(schoolId: string) {
  const items = await prisma.swotItem.findMany({
    where: { schoolId },
    orderBy: { order: "asc" },
  });
  const byCategory = (category: string) =>
    items.filter((item) => item.category === category).map((item) => item.text);
  return {
    STRENGTH: byCategory("STRENGTH"),
    WEAKNESS: byCategory("WEAKNESS"),
    OPPORTUNITY: byCategory("OPPORTUNITY"),
    THREAT: byCategory("THREAT"),
  };
}

export async function getKeyIssues(schoolId: string) {
  const items = await prisma.keyIssue.findMany({
    where: { schoolId },
    orderBy: { order: "asc" },
  });
  return items.map((item) => item.text);
}

export async function getCompletedSteps(schoolId: string): Promise<Set<number>> {
  const rows = await prisma.wizardStepProgress.findMany({
    where: { schoolId },
    select: { step: true },
  });
  return new Set(rows.map((r) => r.step));
}
