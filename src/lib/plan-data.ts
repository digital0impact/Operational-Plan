import "server-only";
import { prisma } from "@/lib/db";

/** يقرأ قيمة نصية من configJson لقسم قالب — يُعيد undefined إن غابت أو لم تكن نصًا. */
export function sectionConfigString(
  configJson: unknown,
  key: string
): string | undefined {
  if (configJson && typeof configJson === "object" && key in configJson) {
    const value = (configJson as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

/**
 * يحمّل خطة عامة (Plan) مع نوعها وقالبها وأقسامه المرتَّبة، ويتحقّق أنها
 * تابعة للمدرسة المطلوبة. يُعيد null إن لم توجد الخطة أو لم تكن ملكًا لهذه
 * المدرسة — تحقّق الملكية هنا، وليس فقط الجلسة، هو ما يمنع مدرسة من الوصول
 * لخطة مدرسة أخرى بتخمين المعرّف.
 */
export async function loadPlanShell(schoolId: string, planId: string) {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, schoolId },
    include: {
      template: {
        include: {
          planType: true,
          sections: { orderBy: { order: "asc" } },
        },
      },
      sectionProgress: { select: { sectionKey: true } },
    },
  });
  if (!plan) return null;

  return {
    id: plan.id,
    templateId: plan.templateId,
    academicYear: plan.academicYear,
    status: plan.status,
    planType: plan.template.planType,
    sections: plan.template.sections,
    completedKeys: new Set(plan.sectionProgress.map((p) => p.sectionKey)),
  };
}

/** كل خطط مدرسة (على المعمار العام) مع اسم النوع ونسبة الإنجاز — للوحة المدرسة. */
export async function getSchoolPlans(schoolId: string) {
  const plans = await prisma.plan.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      template: {
        include: { planType: true, sections: { select: { key: true } } },
      },
      sectionProgress: { select: { sectionKey: true } },
    },
  });

  return plans.map((plan) => {
    const totalSections = plan.template.sections.length;
    const completedSections = plan.sectionProgress.length;
    const firstIncomplete =
      plan.template.sections.find(
        (s) => !plan.sectionProgress.some((p) => p.sectionKey === s.key)
      )?.key ?? plan.template.sections[0]?.key;

    return {
      id: plan.id,
      academicYear: plan.academicYear,
      status: plan.status,
      planTypeName: plan.template.planType.nameAr,
      totalSections,
      completedSections,
      progressPercent:
        totalSections === 0 ? 0 : Math.round((completedSections / totalSections) * 100),
      nextSectionKey: firstIncomplete,
    };
  });
}

/** أنواع الخطط المتاحة لإنشاء خطة جديدة عليها — كل نوع له قالب فعّال واحد
 * على الأقل، باستثناء "operational" (يبقى مسارها الحالي عبر /wizard). */
export async function getStartablePlanTypes() {
  const types = await prisma.planType.findMany({
    where: { key: { not: "operational" }, templates: { some: { isActive: true } } },
    orderBy: { createdAt: "asc" },
    include: {
      templates: { where: { isActive: true }, orderBy: { version: "desc" }, take: 1 },
    },
  });
  return types
    .filter((t) => t.templates.length > 0)
    .map((t) => ({ id: t.id, key: t.key, nameAr: t.nameAr, nameEn: t.nameEn, activeTemplateId: t.templates[0].id }));
}

/** عناصر قسم من نوع قائمة نصية (OBJECTIVES_LIST) تابعة لخطة وقسم معيّن. */
export async function getObjectivesForSection(planId: string, sectionKey: string) {
  return prisma.planObjective.findMany({
    where: { planId, sectionKey },
    orderBy: { order: "asc" },
  });
}

/** أهداف قسم مصدر (بحسب objectivesSectionKey) مع مؤشر كل هدف إن وُجد. */
export async function getIndicatorsData(planId: string, objectivesSectionKey: string) {
  const objectives = await prisma.planObjective.findMany({
    where: { planId, sectionKey: objectivesSectionKey },
    orderBy: { order: "asc" },
    include: { indicators: { orderBy: { order: "asc" }, take: 1 } },
  });
  return objectives.map((o) => ({
    objectiveId: o.id,
    order: o.order,
    text: o.text,
    indicator: o.indicators[0]?.indicator ?? "",
    targetValue: o.indicators[0]?.targetValue ?? "",
    actualValue: o.indicators[0]?.actualValue ?? "",
  }));
}

/** أهداف قسم مصدر مع قائمة البرامج/الأنشطة تحت كل هدف. */
export async function getProgramsData(planId: string, objectivesSectionKey: string) {
  const objectives = await prisma.planObjective.findMany({
    where: { planId, sectionKey: objectivesSectionKey },
    orderBy: { order: "asc" },
    include: { programs: { orderBy: { order: "asc" } } },
  });
  return objectives.map((o) => ({
    objectiveId: o.id,
    order: o.order,
    text: o.text,
    programs: o.programs.map((p) => ({ id: p.id, name: p.name })),
  }));
}

/**
 * الخطة التفصيلية: تحلّ programsSectionKey إلى إعداد القسم الذي يستضيف
 * البرامج، ثم تصعد منه إلى objectivesSectionKey لتحميل الأهداف وبرامجها
 * وأنشطة كل برنامج (بأحدث نشاط واحد لكل برنامج، بنفس نمط ActionItem القديم).
 */
export async function getDetailPlanData(
  templateId: string,
  planId: string,
  programsSectionKey: string
) {
  const programsSection = await prisma.planTemplateSection.findUnique({
    where: { templateId_key: { templateId, key: programsSectionKey } },
  });
  const objectivesSectionKey = sectionConfigString(
    programsSection?.configJson,
    "objectivesSectionKey"
  );
  if (!objectivesSectionKey) return [];

  const objectives = await prisma.planObjective.findMany({
    where: { planId, sectionKey: objectivesSectionKey },
    orderBy: { order: "asc" },
    include: {
      programs: {
        orderBy: { order: "asc" },
        include: {
          activities: {
            orderBy: { order: "asc" },
            take: 1,
            include: { evidence: { orderBy: { order: "asc" }, take: 1 } },
          },
        },
      },
    },
  });

  return objectives.map((o) => ({
    objectiveId: o.id,
    text: o.text,
    programs: o.programs.map((p) => {
      const activity = p.activities[0];
      return {
        programId: p.id,
        name: p.name,
        activity: activity?.activity ?? "",
        targetCategory: activity?.targetCategory ?? "",
        executionRequirements: activity?.executionRequirements ?? "",
        executionDate: activity?.executionDate ?? "",
        responsible: activity?.responsible ?? "",
        evidence: activity?.evidence[0]?.textValue ?? "",
      };
    }),
  }));
}
