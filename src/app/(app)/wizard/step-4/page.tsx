import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { confirmStep4Action } from "@/app/actions/wizard";
import { WizardShell } from "@/components/wizard-shell";
import { SubmitButton } from "@/components/submit-button";
import {
  BUILDING_INDEPENDENCE_OPTIONS,
  BUILDING_TYPE_OPTIONS,
  PERFORMANCE_LEVEL_OPTIONS,
  PROCEDURE_INPUTS,
  STUDY_TIME_OPTIONS,
  findLabel,
} from "@/lib/constants";

export const metadata: Metadata = { title: "مراجعة وتأكيد" };

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value || "—"}</span>
    </div>
  );
}

export default async function WizardStep4Page() {
  const user = await getCurrentUser();
  const school = user!.school!;

  const inputs = await prisma.procedureInput.findMany({
    where: { schoolId: school.id },
  });
  const acknowledgedCount = inputs.filter((i) => i.acknowledged).length;

  const alreadyConfirmed = Boolean(school.step4CompletedAt);

  return (
    <WizardShell
      currentStep={4}
      description="راجع كل ما تم إدخاله قبل اعتماد هذا الجزء من الخطة التشغيلية."
    >
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="mb-1 text-sm font-bold text-ink">بيانات المدرسة</h3>
          <div className="rounded-lg border border-border px-3">
            <SummaryRow label="الرقم الوزاري" value={school.ministryNumber ?? ""} />
            <SummaryRow
              label="وقت الدراسة"
              value={findLabel(STUDY_TIME_OPTIONS, school.studyTime)}
            />
            <SummaryRow
              label="عدد الطلاب"
              value={school.studentsCount?.toString() ?? ""}
            />
            <SummaryRow
              label="عدد الفصول"
              value={school.classroomsCount?.toString() ?? ""}
            />
            <SummaryRow
              label="نوع المبنى"
              value={findLabel(BUILDING_TYPE_OPTIONS, school.buildingType)}
            />
            <SummaryRow
              label="استقلالية المبنى"
              value={findLabel(
                BUILDING_INDEPENDENCE_OPTIONS,
                school.buildingIndependence
              )}
            />
            <SummaryRow label="هاتف المدرسة" value={school.phone ?? ""} />
            <SummaryRow label="بريد المدرسة" value={school.schoolEmail ?? ""} />
            <SummaryRow label="العنوان" value={school.address ?? ""} />
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-bold text-ink">مستوى الأداء</h3>
          <div className="rounded-lg border border-border px-3">
            <SummaryRow
              label="مستوى الأداء العام"
              value={findLabel(PERFORMANCE_LEVEL_OPTIONS, school.performanceGeneral)}
            />
            <SummaryRow
              label="مستوى الإدارة المدرسية"
              value={findLabel(
                PERFORMANCE_LEVEL_OPTIONS,
                school.performanceManagement
              )}
            />
            <SummaryRow
              label="مستوى التعليم والتعلم"
              value={findLabel(
                PERFORMANCE_LEVEL_OPTIONS,
                school.performanceTeachingLearning
              )}
            />
            <SummaryRow
              label="مستوى نواتج التعلم"
              value={findLabel(
                PERFORMANCE_LEVEL_OPTIONS,
                school.performanceLearningOutcomes
              )}
            />
            <SummaryRow
              label="مستوى البيئة المدرسية"
              value={findLabel(
                PERFORMANCE_LEVEL_OPTIONS,
                school.performanceEnvironment
              )}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-bold text-ink">مدخلات الإجراء</h3>
          <div className="rounded-lg border border-border px-3">
            <SummaryRow
              label="عدد المدخلات المؤكدة"
              value={`${acknowledgedCount} من ${PROCEDURE_INPUTS.length}`}
            />
          </div>
        </section>

        {alreadyConfirmed ? (
          <p className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
            تم اعتماد هذا الجزء من الخطة التشغيلية.
          </p>
        ) : (
          <form action={confirmStep4Action}>
            <SubmitButton pendingLabel="جارٍ الاعتماد…">
              اعتماد وإنهاء الخطوات 1–4
            </SubmitButton>
          </form>
        )}
      </div>
    </WizardShell>
  );
}
