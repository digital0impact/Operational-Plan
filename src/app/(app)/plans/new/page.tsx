import type { Metadata } from "next";
import { getStartablePlanTypes } from "@/lib/plan-data";
import { CreatePlanForm } from "@/components/plans/create-plan-form";

export const metadata: Metadata = { title: "إنشاء خطة جديدة" };

export default async function NewPlanPage() {
  const planTypes = await getStartablePlanTypes();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">إنشاء خطة جديدة</h1>
        <p className="mt-1 text-muted">
          اختر نوع الخطة الذي تريد البدء به. الخطة التشغيلية لها معالجها
          الخاص من الرئيسية ولا تُنشأ من هنا.
        </p>
      </div>

      {planTypes.length === 0 ? (
        <p className="text-sm text-muted">
          لا توجد أنواع خطط متاحة بعد. تواصل مع الإدارة العامة للتعليم.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {planTypes.map((type) => (
            <CreatePlanForm
              key={type.id}
              templateId={type.activeTemplateId}
              nameAr={type.nameAr}
              nameEn={type.nameEn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
