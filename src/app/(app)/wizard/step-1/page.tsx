import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { WizardShell } from "@/components/wizard-shell";
import { Step1Form } from "@/components/step1-form";

export const metadata: Metadata = { title: "بيانات المدرسة الأساسية" };

export default async function WizardStep1Page() {
  const user = await getCurrentUser();
  const school = user!.school!;

  return (
    <WizardShell
      currentStep={1}
      description="أكمل بيانات المدرسة الرسمية كما وردت في دليل إجراءات عمل مدارس التعليم العام."
    >
      <Step1Form
        defaults={{
          ministryNumber: school.ministryNumber,
          studyTime: school.studyTime,
          studentsCount: school.studentsCount,
          classroomsCount: school.classroomsCount,
          buildingType: school.buildingType,
          educationType: school.educationType,
          buildingIndependence: school.buildingIndependence,
          phone: school.phone,
          schoolEmail: school.schoolEmail,
          address: school.address,
        }}
      />
    </WizardShell>
  );
}
