"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";

/** يمنع تصويت المتصفح نفسه أكثر من مرة على نفس المبادرة/البرنامج. */
function voteCookieName(initiativeId: string): string {
  return `voted_${initiativeId}`;
}

export async function castVoteAction(
  token: string,
  initiativeId: string,
  formData: FormData
): Promise<void> {
  const initiative = await prisma.initiativeProgram.findFirst({
    where: { id: initiativeId, operationalGoal: { school: { voteToken: token } } },
  });
  if (!initiative) {
    redirect(`/vote/${token}`);
  }

  const cookieStore = await cookies();
  const alreadyVoted = Boolean(cookieStore.get(voteCookieName(initiativeId))?.value);

  if (!alreadyVoted) {
    const voterName = ((formData.get("voterName") as string) ?? "").trim() || null;
    await prisma.vote.create({ data: { initiativeId, voterName } });
    cookieStore.set(voteCookieName(initiativeId), "1", {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  redirect(`/vote/${token}`);
}

const evaluationSchema = z.object({
  reviewerName: z.string().trim().min(2).max(100),
  reviewerRole: z.enum(["SUPERVISOR", "PARENT", "OTHER"]),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function submitEvaluationAction(
  token: string,
  formData: FormData
): Promise<void> {
  const school = await prisma.school.findUnique({ where: { shareToken: token } });
  if (!school) {
    redirect("/");
  }

  const parsed = evaluationSchema.safeParse({
    reviewerName: formData.get("reviewerName"),
    reviewerRole: formData.get("reviewerRole"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    redirect(`/share/${token}?error=1`);
  }

  await prisma.evaluation.create({
    data: { schoolId: school.id, ...parsed.data },
  });

  redirect(`/share/${token}?thanks=1`);
}
