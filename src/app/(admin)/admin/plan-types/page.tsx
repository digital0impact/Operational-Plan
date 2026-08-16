import type { Metadata } from "next";
import { getPlanTypesOverview } from "@/lib/admin-data";
import {
  deletePlanTypeAction,
  deleteTemplateSectionAction,
} from "@/app/actions/plan-types";
import { CreatePlanTypeForm } from "@/components/admin/create-plan-type-form";
import { AddTemplateSectionForm } from "@/components/admin/add-template-section-form";
import { findLabel, PLAN_SECTION_KINDS } from "@/lib/constants";

export const metadata: Metadata = { title: "أنواع الخطط" };

export default async function AdminPlanTypesPage() {
  const planTypes = await getPlanTypesOverview();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">أنواع الخطط والقوالب</h1>
        <p className="mt-1 text-muted">
          الأساس الذي تُبنى عليه أنواع الخطط الجديدة (النشاط الطلابي، الإرشاد،
          الإذاعة المدرسية...) — إنشاء نوع خطة وقالبه وأقسامه هنا لا يؤثر
          إطلاقًا على معالج الخطة التشغيلية الحالي أو أي مدرسة مسجَّلة.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-bold text-ink">إنشاء نوع خطة جديد</h2>
        <CreatePlanTypeForm />
      </section>

      {planTypes.length === 0 ? (
        <p className="text-sm text-muted">لا توجد أنواع خطط بعد.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {planTypes.map((planType) => {
            const activeTemplate =
              planType.templates.find((t) => t.isActive) ?? planType.templates[0];
            const nextOrder = activeTemplate
              ? activeTemplate.sections.length === 0
                ? 1
                : Math.max(...activeTemplate.sections.map((s) => s.order)) + 1
              : 1;

            return (
              <section
                key={planType.id}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-ink">{planType.nameAr}</h2>
                      <span
                        className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted"
                        dir="ltr"
                      >
                        {planType.key}
                      </span>
                      {planType.isCustom ? (
                        <span className="rounded-full bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber">
                          مخصَّص
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-muted" dir="ltr">
                      {planType.nameEn}
                    </p>
                  </div>
                  <form action={deletePlanTypeAction.bind(null, planType.id)}>
                    <button
                      type="submit"
                      className="text-xs text-muted hover:text-danger"
                    >
                      حذف نوع الخطة
                    </button>
                  </form>
                </div>

                {!activeTemplate ? (
                  <p className="mt-4 text-sm text-muted">لا يوجد قالب لهذا النوع.</p>
                ) : (
                  <div className="mt-4 flex flex-col gap-4">
                    <p className="font-mono text-xs text-muted">
                      القالب الفعّال — نسخة {activeTemplate.version}
                    </p>

                    {activeTemplate.sections.length === 0 ? (
                      <p className="text-sm text-muted">لا توجد أقسام في هذا القالب بعد.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-border text-right text-xs text-muted">
                              <th className="py-2 pl-2">الترتيب</th>
                              <th className="py-2 pl-2">المعرّف</th>
                              <th className="py-2 pl-2">العنوان</th>
                              <th className="py-2 pl-2">النوع</th>
                              <th className="py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeTemplate.sections.map((section) => (
                              <tr
                                key={section.id}
                                className="border-b border-border last:border-0"
                              >
                                <td className="py-2.5 pl-2 font-mono text-xs text-muted">
                                  {section.order}
                                </td>
                                <td
                                  className="py-2.5 pl-2 font-mono text-xs text-ink"
                                  dir="ltr"
                                >
                                  {section.key}
                                </td>
                                <td className="py-2.5 pl-2 text-ink">{section.titleAr}</td>
                                <td className="py-2.5 pl-2 text-muted">
                                  {findLabel(PLAN_SECTION_KINDS, section.kind)}
                                </td>
                                <td className="py-2.5">
                                  <form
                                    action={deleteTemplateSectionAction.bind(
                                      null,
                                      section.id
                                    )}
                                  >
                                    <button
                                      type="submit"
                                      className="text-xs text-muted hover:text-danger"
                                    >
                                      حذف
                                    </button>
                                  </form>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="rounded-lg border border-dashed border-border p-3.5">
                      <AddTemplateSectionForm
                        templateId={activeTemplate.id}
                        nextOrder={nextOrder}
                      />
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
