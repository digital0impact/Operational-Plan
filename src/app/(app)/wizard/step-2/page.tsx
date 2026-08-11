import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { WizardShell } from "@/components/wizard-shell";
import { Step2Form } from "@/components/step2-form";

export const metadata: Metadata = { title: "مستوى الأداء العام" };

export default async function WizardStep2Page() {
  const user = await getCurrentUser();
  const school = user!.school!;

  return (
    <WizardShell
      currentStep={2}
      description="حدد مستوى أداء المدرسة العام والمستويات الفرعية الأربعة وفق آخر نتائج تقييم."
    >
      <Step2Form
        defaults={{
          performanceGeneral: school.performanceGeneral,
          performanceManagement: school.performanceManagement,
          performanceTeachingLearning: school.performanceTeachingLearning,
          performanceLearningOutcomes: school.performanceLearningOutcomes,
          performanceEnvironment: school.performanceEnvironment,
        }}
      />
    </WizardShell>
  );
}
