import "server-only";
import { prisma } from "@/lib/db";
import { TOTAL_WIZARD_STEPS } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";

export const SCHOOL_OPERATIONAL_PLAN_TYPE_KEY = "SCHOOL_OPERATIONAL" as const;
export const OFFICIAL_OPERATIONAL_TEMPLATE_KEY = "OFFICIAL_OPERATIONAL_1447_1448" as const;
export const CURRENT_ACADEMIC_YEAR = "1447-1448";
export const OPERATIONAL_PLAN_TITLE = "الخطة التشغيلية";

export function calculateOperationalProgressPercent(completedSteps: number): number {
  return Math.min(100, Math.round((completedSteps / TOTAL_WIZARD_STEPS) * 100));
}

export function deriveOperationalPlanStatus(completedSteps: number, currentStep: number) {
  if (completedSteps >= TOTAL_WIZARD_STEPS) {
    return "COMPLETED" as const;
  }
  if (completedSteps > 0 || currentStep > 1) {
    return "IN_PROGRESS" as const;
  }
  return "DRAFT" as const;
}

export async function ensureOperationalPlanFoundation(
  tx: Prisma.TransactionClient = prisma
) {
  const planType = await tx.planType.upsert({
    where: { key: SCHOOL_OPERATIONAL_PLAN_TYPE_KEY },
    update: {
      nameAr: "الخطة التشغيلية المدرسية",
      nameEn: "School Operational Plan",
      description:
        "نوع الخطة التشغيلية المدرسية الحالي؛ يبقى مستقلًا عن جداول الخطة التشغيلية القائمة في مرحلة التأسيس.",
      isSystem: true,
      isActive: true,
    },
    create: {
      key: SCHOOL_OPERATIONAL_PLAN_TYPE_KEY,
      nameAr: "الخطة التشغيلية المدرسية",
      nameEn: "School Operational Plan",
      description:
        "نوع الخطة التشغيلية المدرسية الحالي؛ يبقى مستقلًا عن جداول الخطة التشغيلية القائمة في مرحلة التأسيس.",
      isSystem: true,
      isActive: true,
    },
  });

  const template = await tx.planTemplate.upsert({
    where: { key: OFFICIAL_OPERATIONAL_TEMPLATE_KEY },
    update: {
      planTypeId: planType.id,
      version: CURRENT_ACADEMIC_YEAR,
      nameAr: "القالب الرسمي للخطة التشغيلية 1447-1448هـ",
      nameEn: "Official Operational Plan 1447-1448 Template",
      description:
        "بيانات وصفية فقط لقالب المعالج التشغيلي الحالي المكوّن من 25 خطوة؛ لا يستبدل تنفيذ المعالج الحالي في هذه المرحلة.",
      schemaJson: {
        wizard: { type: "existing_operational_wizard", totalSteps: TOTAL_WIZARD_STEPS, metadataOnly: true },
      },
      isPublished: true,
    },
    create: {
      planTypeId: planType.id,
      key: OFFICIAL_OPERATIONAL_TEMPLATE_KEY,
      version: CURRENT_ACADEMIC_YEAR,
      nameAr: "القالب الرسمي للخطة التشغيلية 1447-1448هـ",
      nameEn: "Official Operational Plan 1447-1448 Template",
      description:
        "بيانات وصفية فقط لقالب المعالج التشغيلي الحالي المكوّن من 25 خطوة؛ لا يستبدل تنفيذ المعالج الحالي في هذه المرحلة.",
      schemaJson: {
        wizard: { type: "existing_operational_wizard", totalSteps: TOTAL_WIZARD_STEPS, metadataOnly: true },
      },
      isPublished: true,
    },
  });

  return { planType, template };
}

export async function getCurrentOperationalPlan(schoolId: string) {
  const existingPlan = await prisma.plan.findFirst({
    where: { schoolId, planType: { key: SCHOOL_OPERATIONAL_PLAN_TYPE_KEY } },
    include: { planType: true, template: true, stepProgress: true },
  });

  if (existingPlan) {
    return existingPlan;
  }

  return prisma.$transaction(async (tx) => {
    const { planType, template } = await ensureOperationalPlanFoundation(tx);

    const school = await tx.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { currentStep: true, shareToken: true, voteToken: true },
    });
    const completedSteps = await tx.wizardStepProgress.count({ where: { schoolId } });

    return tx.plan.upsert({
      where: { schoolId_planTypeId: { schoolId, planTypeId: planType.id } },
      update: {},
      create: {
        schoolId,
        planTypeId: planType.id,
        templateId: template.id,
        academicYear: CURRENT_ACADEMIC_YEAR,
        title: OPERATIONAL_PLAN_TITLE,
        status: deriveOperationalPlanStatus(completedSteps, school.currentStep),
        currentStep: school.currentStep,
        progressPercent: calculateOperationalProgressPercent(completedSteps),
        shareToken: school.shareToken,
        voteToken: school.voteToken,
        completedAt: completedSteps >= TOTAL_WIZARD_STEPS ? new Date() : null,
      },
      include: { planType: true, template: true, stepProgress: true },
    });
  });
}

export async function syncOperationalPlanProgress(schoolId: string, step?: number, completedByUserId?: string) {
  const plan = await getCurrentOperationalPlan(schoolId);
  const [completedSteps, school] = await Promise.all([
    prisma.wizardStepProgress.count({ where: { schoolId } }),
    prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { currentStep: true } }),
  ]);
  const status = deriveOperationalPlanStatus(completedSteps, school.currentStep);

  await prisma.plan.update({
    where: { id: plan.id },
    data: {
      currentStep: school.currentStep,
      progressPercent: calculateOperationalProgressPercent(completedSteps),
      status,
      completedAt: status === "COMPLETED" ? plan.completedAt ?? new Date() : null,
    },
  });

  if (step) {
    await prisma.planStepProgress.upsert({
      where: { planId_step: { planId: plan.id, step } },
      update: { completedByUserId },
      create: { planId: plan.id, step, completedByUserId },
    });
  }
}
