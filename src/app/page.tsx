import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التخطيط الذكي — منصة خطط مدارس التعليم العام",
  description:
    "أعدّ كل خطط مدرستك — التشغيلية والنشاط الطلابي ورعاية الموهوبين والتوجيه الطلابي والإرشاد الصحي وغيرها — في منصة واحدة، وفق دليل إجراءات عمل مدارس التعليم العام.",
};

const PLAN_TYPES = [
  {
    emoji: "📋",
    name: "الخطة التشغيلية",
    desc: "معالج كامل من 25 خطوة: الأهداف الاستراتيجية والتشغيلية، مؤشرات الأداء، تحليل SWOT، القضايا والمبادرات، والخطة التفصيلية.",
  },
  {
    emoji: "🎨",
    name: "خطة النشاط الطلابي",
    desc: "أهداف ومؤشرات وبرامج وأنشطة، خطة تفصيلية لكل برنامج، وجدول أسبوعي كامل للفصل الدراسي.",
  },
  {
    emoji: "⭐",
    name: "خطة رعاية الموهوبين",
    desc: "من حصر اهتمامات الموهوبين إلى برامج إثرائية وجدول زمني واضح للتنفيذ.",
  },
  {
    emoji: "🧭",
    name: "خطة برامج التوجيه الطلابي",
    desc: "أهداف إرشادية وبرامج وأنشطة تنفيذية، بنطاقها التنفيذي المحدد.",
  },
  {
    emoji: "🩺",
    name: "خطة الإرشاد الصحي",
    desc: "فعاليات وبرامج صحية مدرسية — من الفحص الاستكشافي إلى متابعة الفريق الصحي.",
  },
  {
    emoji: "🔍",
    name: "خطة التقويم الذاتي",
    desc: "أهداف ومؤشرات تحقّق وأدوار ومسؤوليات وأدوات تنفيذ التقويم الذاتي.",
  },
  {
    emoji: "🚀",
    name: "خطة التحسين والتطوير والاستدامة",
    desc: "جوانب تحسين مستخلَصة من نتائج التقويم الذاتي، وإجراءات تحسين ومتابعة.",
  },
  {
    emoji: "🗓️",
    name: "الخطة الفصلية",
    desc: "جدول أحداث فصلي يُبنى تلقائيًا من خطط التوجيه والنشاط والإرشاد الصحي — بلا إدخال مكرر.",
  },
];

const FEATURES = [
  {
    emoji: "📄",
    title: "تصدير PDF احترافي",
    desc: "لكل خطة كاملة، أو لأي قسم بمفرده كالجدول الأسبوعي، بضغطة واحدة وبتنسيق عربي جاهز للاعتماد.",
  },
  {
    emoji: "✨",
    title: "اقتراح بالذكاء الاصطناعي",
    desc: "صياغة الأهداف ومؤشرات الأداء وبنود SWOT وتفاصيل التنفيذ بمساعدة الذكاء الاصطناعي.",
  },
  {
    emoji: "🔗",
    title: "روابط عامة بلا تسجيل دخول",
    desc: "للتصويت على المبادرات، ولمشاركة الخطة وتقييمها من المشرف التربوي وأولياء الأمور.",
  },
  {
    emoji: "🗓️",
    title: "خطة فصلية تلقائية",
    desc: "تُشتق من بيانات مُدخَلة أصلًا في الخطط الأخرى، فلا تكرار في الإدخال بين الخطط.",
  },
  {
    emoji: "🏫",
    title: "زيارات صفية منظَّمة",
    desc: "جدولة زيارة صفية ومتابعة ردّ المعلم/ة (تأكيد أو إعادة جدولة) برابط عام بسيط.",
  },
  {
    emoji: "🛡️",
    title: "لوحة إدارة عامة",
    desc: "نظرة عامة على كل المدارس المسجَّلة، وإصدار رموز التفعيل ومتابعتها من مكان واحد.",
  },
];

const PRICING_GROUPS = [
  {
    title: "الاشتراك الشامل",
    subtitle: "كل أنواع الخطط الثماني، حتى 4 حسابات للمدرسة الواحدة",
    plans: [
      {
        name: "نصف سنوي",
        price: "249",
        period: "لكل مدرسة / 6 أشهر",
        features: [
          "جميع أنواع الخطط الثماني",
          "تصدير PDF لكل خطة أو أي قسم بمفرده",
          "اقتراحات بالذكاء الاصطناعي",
          "روابط عامة للتصويت والتقييم والزيارات الصفية",
          "حتى 4 حسابات للمدرسة الواحدة",
        ],
        highlight: false,
      },
      {
        name: "سنوي",
        price: "499",
        period: "لكل مدرسة / 12 شهرًا",
        features: [
          "كل مزايا الاشتراك النصف سنوي",
          "تغطية عام دراسي كامل بلا تجديد نصف سنوي",
          "أولوية الدعم الفني",
        ],
        highlight: true,
      },
    ],
  },
  {
    title: "اشتراك خطة واحدة",
    subtitle: "نوع خطة واحد تختاره، بحساب واحد فقط",
    plans: [
      {
        name: "نصف سنوي",
        price: "99",
        period: "لخطة واحدة / 6 أشهر",
        features: [
          "خطة واحدة تختارها عند الشراء",
          "تصدير PDF للخطة المشترَك بها",
          "اقتراحات بالذكاء الاصطناعي لنفس الخطة",
        ],
        highlight: false,
      },
      {
        name: "سنوي",
        price: "199",
        period: "لخطة واحدة / 12 شهرًا",
        features: [
          "كل مزايا الاشتراك النصف سنوي",
          "تغطية عام دراسي كامل بلا تجديد نصف سنوي",
        ],
        highlight: false,
      },
    ],
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "GENERAL_ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="min-h-full bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg text-accent-ink">
              🏫
            </span>
            <span className="text-base font-extrabold text-ink">التخطيط الذكي</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="#pricing"
              className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-ink transition hover:text-accent sm:inline-block"
            >
              الأسعار
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-ink transition hover:text-accent"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink transition hover:opacity-90"
            >
              تسجيل مدرسة جديدة
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
          <span className="inline-block rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-semibold text-accent">
            وفق دليل إجراءات عمل مدارس التعليم العام — الإصدار الرابع
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            كل خطط مدرستك، في منصة واحدة
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
            من الخطة التشغيلية إلى خطة النشاط الطلابي ورعاية الموهوبين والتوجيه
            الطلابي والإرشاد الصحي — أعدّها، تابع تقدّمها أولًا بأول، وصدّرها
            PDF جاهزة للاعتماد، بلا تعقيد.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-accent px-5 py-3 text-sm font-bold text-accent-ink transition hover:opacity-90"
            >
              ابدأ الآن — سجّل مدرستك
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
            >
              تسجيل الدخول
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-ink">أنواع الخطط المدعومة</h2>
            <p className="mt-2 text-sm text-muted">
              ثماني خطط مدرسية رسمية، كل واحدة بنموذجها الخاص المطابق للدليل
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_TYPES.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-border bg-surface p-5 transition hover:border-accent"
              >
                <span className="text-2xl" aria-hidden="true">
                  {p.emoji}
                </span>
                <h3 className="mt-3 text-sm font-bold text-ink">{p.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface-2 py-14">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-extrabold text-ink">
              لماذا التخطيط الذكي
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="text-center">
                  <span
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-xl"
                    aria-hidden="true"
                  >
                    {f.emoji}
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-ink">{f.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-5xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-ink">خطط الاشتراك</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              اشترك بكل أنواع الخطط لمدرستك، أو بخطة واحدة فقط تحتاجها —
              اختر ما يناسبك
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-12">
            {PRICING_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-ink">{group.title}</h3>
                  <p className="mt-1 text-sm text-muted">{group.subtitle}</p>
                </div>
                <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
                  {group.plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`relative rounded-2xl border p-6 ${
                        plan.highlight
                          ? "border-accent bg-surface shadow-sm"
                          : "border-border bg-surface"
                      }`}
                    >
                      {plan.highlight && (
                        <span className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
                          الأكثر توفيرًا
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-ink">{plan.name}</h4>
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-ink">
                          {plan.price}
                        </span>
                        <span className="text-sm font-semibold text-muted">ريال</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{plan.period}</p>
                      <ul className="mt-5 flex flex-col gap-2.5">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-xs leading-relaxed text-ink"
                          >
                            <span className="mt-0.5 text-accent" aria-hidden="true">
                              ✓
                            </span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-2xl font-extrabold text-ink">جاهز تبدأ؟</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            سجّل مدرستك مجانًا وابدأ إعداد خططك خلال دقائق — وارتقِ لاحقًا
            إلى خطة مدفوعة برمز اشتراك يصلك من متجر معين عند الاشتراك.
          </p>
          <div className="mt-6">
            <Link
              href="/register"
              className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-bold text-accent-ink transition hover:opacity-90"
            >
              تسجيل مدرسة جديدة
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        © 2026 التخطيط الذكي. جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
