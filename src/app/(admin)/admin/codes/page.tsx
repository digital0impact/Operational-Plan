import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { deleteActivationCodeAction } from "@/app/actions/admin";
import { GenerateCodesForm } from "@/components/admin/generate-codes-form";

export const metadata: Metadata = { title: "رموز التفعيل" };

export default async function AdminCodesPage() {
  const [codes, planTypes] = await Promise.all([
    prisma.activationCode.findMany({
      include: { school: { select: { name: true } }, planType: { select: { nameAr: true } } },
      orderBy: { createdAt: "desc" },
    }),
    // الخطة الفصلية مُشتقّة من خطط أخرى ولا معنى للاشتراك بها وحدها
    prisma.planType.findMany({
      where: { key: { not: "quarterly" } },
      orderBy: { createdAt: "asc" },
      select: { id: true, nameAr: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">رموز الاشتراك</h1>
        <p className="mt-1 text-muted">
          أصدر رموز اشتراك لإرسالها للمدارس عند الشراء من المتجر، لترقية
          حساباتها القائمة إلى خطة مدفوعة.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-bold text-ink">إصدار رموز جديدة</h2>
        <GenerateCodesForm planTypes={planTypes} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-bold text-ink">
          كل الرموز ({codes.length})
        </h2>

        {codes.length === 0 ? (
          <p className="text-sm text-muted">لم تُصدَر أي رموز بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-right text-xs text-muted">
                  <th className="py-2 pl-2">الرمز</th>
                  <th className="py-2 pl-2">النطاق</th>
                  <th className="py-2 pl-2">المدة</th>
                  <th className="py-2 pl-2">الحالة</th>
                  <th className="py-2 pl-2">ملاحظة</th>
                  <th className="py-2 pl-2">المدرسة</th>
                  <th className="py-2 pl-2">تاريخ الإصدار</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pl-2 font-mono text-xs text-ink" dir="ltr">
                      {code.code}
                    </td>
                    <td className="py-2.5 pl-2 text-ink">
                      {code.planType ? code.planType.nameAr : "شامل (كل الخطط)"}
                    </td>
                    <td className="py-2.5 pl-2 text-muted">
                      {code.durationMonths === 6 ? "نصف سنوي" : `${code.durationMonths} شهرًا`}
                    </td>
                    <td className="py-2.5 pl-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-semibold " +
                          (code.used
                            ? "bg-accent-soft text-accent"
                            : "bg-surface-2 text-muted")
                        }
                      >
                        {code.used ? "مُستخدم" : "متاح"}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-muted">{code.issuedFor ?? "—"}</td>
                    <td className="py-2.5 pl-2 text-ink">{code.school?.name ?? "—"}</td>
                    <td className="py-2.5 pl-2 font-mono text-xs text-muted">
                      {new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
                        code.createdAt
                      )}
                    </td>
                    <td className="py-2.5">
                      {code.used ? null : (
                        <form action={deleteActivationCodeAction.bind(null, code.id)}>
                          <button
                            type="submit"
                            className="text-xs text-muted hover:text-danger"
                          >
                            حذف
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
