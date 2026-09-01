import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PublicShell } from "@/components/public/public-shell";
import { AcceptInviteForm } from "@/components/team/accept-invite-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { school: { select: { name: true } } },
  });
  return { title: invite ? `دعوة انضمام — ${invite.school.name}` : "رابط غير صالح" };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { school: { select: { name: true } } },
  });

  if (!invite) {
    return (
      <PublicShell
        schoolName="—"
        title="رابط غير صالح"
        subtitle="تعذّر العثور على هذه الدعوة."
      >
        <p className="text-sm text-muted">
          تأكد من الرابط الذي وصلك، أو تواصل مع مدير مدرستك لإرسال دعوة جديدة.
        </p>
      </PublicShell>
    );
  }

  if (invite.acceptedAt) {
    return (
      <PublicShell
        schoolName={invite.school.name}
        title="الدعوة مُستخدمة بالفعل"
        subtitle="تم قبول هذه الدعوة من قبل."
      >
        <a
          href="/login"
          className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90"
        >
          تسجيل الدخول
        </a>
      </PublicShell>
    );
  }

  return (
    <PublicShell
      schoolName={invite.school.name}
      title="دعوة انضمام لفريق المدرسة"
      subtitle={`دُعيت للانضمام كعضو فريق في مدرسة ${invite.school.name} (${invite.email})`}
    >
      <div className="rounded-xl border border-border bg-surface p-5">
        <AcceptInviteForm token={token} />
      </div>
    </PublicShell>
  );
}
