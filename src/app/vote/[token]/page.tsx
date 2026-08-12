import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getSchoolByVoteToken, getVotableGoals } from "@/lib/public-data";
import { castVoteAction } from "@/app/actions/public";
import { PublicShell } from "@/components/public/public-shell";
import { INITIATIVE_TYPES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const school = await getSchoolByVoteToken(token);
  return { title: school ? `التصويت — ${school.name}` : "رابط غير صالح" };
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const school = await getSchoolByVoteToken(token);
  if (!school) notFound();

  const [goals, cookieStore] = await Promise.all([
    getVotableGoals(school.id),
    cookies(),
  ]);

  const goalsWithInitiatives = goals.filter((g) => g.initiatives.length > 0);

  return (
    <PublicShell
      schoolName={school.name}
      title="التصويت على المبادرات والبرامج"
      subtitle="اختر الأصوات الداعمة للمبادرات والبرامج المقترحة ضمن الخطة التشغيلية — صوت واحد لكل بند من هذا الجهاز."
    >
      {goalsWithInitiatives.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
          لم تُضف مبادرات أو برامج للتصويت عليها بعد.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {goalsWithInitiatives.map((goal) => (
            <section key={goal.id}>
              <h2 className="mb-2 text-sm font-bold text-ink">
                {goal.strategicGoal.order}. {goal.text || goal.strategicGoal.title}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {goal.initiatives.map((initiative) => {
                  const voted = Boolean(
                    cookieStore.get(`voted_${initiative.id}`)?.value
                  );
                  const action = castVoteAction.bind(null, token, initiative.id);
                  return (
                    <div
                      key={initiative.id}
                      className="rounded-xl border border-border bg-surface p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                          {INITIATIVE_TYPES[
                            initiative.type as "INITIATIVE" | "PROGRAM"
                          ]?.label ?? initiative.type}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          {initiative.votes.length} صوت
                        </span>
                      </div>
                      <p className="mb-3 text-sm font-medium text-ink">
                        {initiative.name}
                      </p>

                      {voted ? (
                        <p className="rounded-lg bg-accent-soft px-3 py-2 text-center text-sm font-semibold text-accent">
                          تم تسجيل تصويتك ✓
                        </p>
                      ) : (
                        <form action={action} className="flex gap-2">
                          <input
                            type="text"
                            name="voterName"
                            placeholder="اسمك (اختياري)"
                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                          />
                          <button
                            type="submit"
                            className="shrink-0 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink transition hover:opacity-90"
                          >
                            تصويت
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </PublicShell>
  );
}
