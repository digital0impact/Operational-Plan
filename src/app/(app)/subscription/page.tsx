import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isPaidPlan, hasFullAccess, MAX_TEAM_SEATS } from "@/lib/subscription";
import { RedeemCodeForm } from "@/components/subscription/redeem-code-form";
import { InviteTeamForm } from "@/components/team/invite-team-form";
import { TeamMembersList } from "@/components/team/team-members-list";

export const metadata: Metadata = { title: "الاشتراك" };

const FULL_PLANS = [
  { name: "نصف سنوي", price: "249", period: "6 أشهر" },
  { name: "سنوي", price: "499", period: "12 شهرًا" },
];

const SINGLE_PLAN_PLANS = [
  { name: "نصف سنوي", price: "99", period: "6 أشهر" },
  { name: "سنوي", price: "199", period: "12 شهرًا" },
];

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string; upgraded?: string }>;
}) {
  const { upgrade, upgraded } = await searchParams;
  const user = await getCurrentUser();
  const school = user!.school!;
  const paid = isPaidPlan(school);
  const full = hasFullAccess(school);

  const [subscriptionPlanType, members, pendingInvites] = await Promise.all([
    school.subscriptionPlanTypeId
      ? prisma.planType.findUnique({
          where: { id: school.subscriptionPlanTypeId },
          select: { nameAr: true },
        })
      : Promise.resolve(null),
    full
      ? prisma.user.findMany({
          where: { schoolId: school.id },
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, email: true, role: true },
        })
      : Promise.resolve([]),
    full
      ? prisma.teamInvite.findMany({
          where: { schoolId: school.id, acceptedAt: null },
          orderBy: { createdAt: "asc" },
          select: { id: true, email: true, token: true },
        })
      : Promise.resolve([]),
  ]);

  const seatsUsed = members.length + pendingInvites.length;
  const canManageTeam = user!.role === "SCHOOL_MANAGER";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">الاشتراك</h1>
        <p className="mt-1 text-muted">
          حالة اشتراك مدرسة {school.name}، وتفعيل رمز اشتراك جديد.
        </p>
      </div>

      {upgraded ? (
        <p className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
          تم تفعيل اشتراكك بنجاح ✓
        </p>
      ) : null}

      {upgrade && !paid ? (
        <p className="rounded-xl border border-amber/30 bg-amber-soft px-4 py-3 text-sm text-ink">
          🔒 الميزة التي حاولت استخدامها متاحة فقط في الخطط المدفوعة — فعّل
          اشتراكك أدناه للوصول إليها.
        </p>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-bold text-ink">حالة الاشتراك الحالية</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className={
              "rounded-full px-3 py-1 text-sm font-semibold " +
              (paid ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted")
            }
          >
            {paid
              ? full
                ? "اشتراك شامل ✓"
                : `اشتراك خطة: ${subscriptionPlanType?.nameAr ?? "—"} ✓`
              : "خطة مجانية"}
          </span>
          {paid && school.subscriptionExpiresAt ? (
            <span className="text-sm text-muted">
              سارية حتى{" "}
              {new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(
                school.subscriptionExpiresAt
              )}
            </span>
          ) : null}
        </div>
        {!paid ? (
          <p className="mt-3 text-sm text-muted">
            على الخطة المجانية يمكنك تصفح المنصة وإعداد كل خططك وحفظها بحرية
            كاملة. تصدير الخطط PDF، اقتراحات الذكاء الاصطناعي، والروابط
            العامة (التصويت والتقييم والزيارات الصفية) متاحة فقط في الخطط
            المدفوعة.
          </p>
        ) : !full ? (
          <p className="mt-3 text-sm text-muted">
            اشتراكك يمنحك المزايا المدفوعة (تصدير PDF، اقتراحات الذكاء
            الاصطناعي) داخل خطة «{subscriptionPlanType?.nameAr}» فقط. للوصول
            لبقية الخطط، الزيارات الصفية، ودعوة أعضاء الفريق، رقِّ إلى
            الاشتراك الشامل.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-bold text-ink">لديك رمز اشتراك؟</h2>
        <p className="mt-1 text-sm text-muted">
          أدخل الرمز الذي وصلك عند الاشتراك من المتجر لتفعيل الخطة المدفوعة
          فورًا.
        </p>
        <div className="mt-4 max-w-sm">
          <RedeemCodeForm />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-bold text-ink">خطط الاشتراك المتاحة</h2>

        <div className="mt-4">
          <p className="text-sm font-bold text-ink">
            الاشتراك الشامل — كل أنواع الخطط، حتى {MAX_TEAM_SEATS} حسابات
          </p>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FULL_PLANS.map((plan) => (
              <div key={plan.name} className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-sm font-bold text-ink">{plan.name}</p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-ink">{plan.price}</span>
                  <span className="text-sm font-semibold text-muted">ريال</span>
                  <span className="text-xs text-muted">/ {plan.period}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm font-bold text-ink">اشتراك خطة واحدة — حساب واحد</p>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SINGLE_PLAN_PLANS.map((plan) => (
              <div key={plan.name} className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-sm font-bold text-ink">{plan.name}</p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-ink">{plan.price}</span>
                  <span className="text-sm font-semibold text-muted">ريال</span>
                  <span className="text-xs text-muted">/ {plan.period}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            يُحدَّد نوع الخطة عند شراء الرمز من المتجر.
          </p>
        </div>

        <p className="mt-4 text-sm text-muted">
          للاشتراك، تواصل مع متجرنا وسيصلك رمز التفعيل فور إتمام الدفع.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-bold text-ink">فريق المدرسة</h2>
        {full ? (
          <>
            <p className="mt-1 text-sm text-muted">
              حتى {MAX_TEAM_SEATS} حسابات للمدرسة الواحدة ({seatsUsed} من{" "}
              {MAX_TEAM_SEATS} مستخدَمة).
            </p>
            <div className="mt-4">
              <TeamMembersList
                members={members}
                pendingInvites={pendingInvites}
                canManage={canManageTeam}
              />
            </div>
            {canManageTeam && seatsUsed < MAX_TEAM_SEATS ? (
              <div className="mt-4 border-t border-border pt-4">
                <InviteTeamForm />
              </div>
            ) : canManageTeam ? (
              <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
                بلغتَ الحد الأقصى للحسابات — أزل عضوًا أو ألغِ دعوة معلَّقة
                لإضافة عضو جديد.
              </p>
            ) : null}
          </>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border bg-surface-2 p-4 text-center">
            <p className="text-sm text-ink">
              🔒 دعوة أعضاء الفريق (حتى {MAX_TEAM_SEATS} حسابات) متاحة فقط مع
              الاشتراك الشامل
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
