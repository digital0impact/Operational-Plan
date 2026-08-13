import "server-only";
import { prisma } from "@/lib/db";

export async function getVisitsForSchool(schoolId: string) {
  return prisma.classroomVisit.findMany({
    where: { schoolId },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function getVisitByToken(token: string) {
  return prisma.classroomVisit.findUnique({
    where: { responseToken: token },
    include: { school: { select: { name: true } } },
  });
}
