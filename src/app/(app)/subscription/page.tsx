import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { isPaidPlan } from "@/lib/subscription";
import { RedeemCodeForm } from "@/components/subscription/redeem-code-form";

export const metadata: Metadata = { title: "الاشتراك" };

const PLANS = [
  {
    name: "نصف سنوي",
    price: "249",
    period: "6 أشهر",
  },
  {
    name: "سنوي",
    price: "499",
    period: "12 شهرًا",
  },
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
            {paid ? "خطة مدفوعة ✓" : "خطة مجانية"}
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
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl border border-border bg-surface-2 p-4"
            >
              <p className="text-sm font-bold text-ink">{plan.name}</p>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-ink">
                  {plan.price}
                </span>
                <span className="text-sm font-semibold text-muted">ريال</span>
                <span className="text-xs text-muted">/ {plan.period}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          للاشتراك، تواصل مع متجرنا وسيصلك رمز التفعيل فور إتمام الدفع.
        </p>
      </section>
    </div>
  );
}
