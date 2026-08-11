import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { WizardShell } from "@/components/wizard-shell";
import { Step3Form } from "@/components/step3-form";

export const metadata: Metadata = { title: "مدخلات الإجراء" };

export default async function WizardStep3Page() {
  const user = await getCurrentUser();
  const school = user!.school!;

  const inputs = await prisma.procedureInput.findMany({
    where: { schoolId: school.id },
  });
  const existing = Object.fromEntries(
    inputs.map((input) => [
      input.type,
      { acknowledged: input.acknowledged, note: input.note },
    ])
  );

  return (
    <WizardShell
      currentStep={3}
      description="راجع مدخلات الإجراء الأربعة المعتمدة في الدليل الرسمي قبل صياغة الأهداف."
    >
      <Step3Form existing={existing} />
    </WizardShell>
  );
}
