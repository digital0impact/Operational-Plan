"use server";

import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSchoolId } from "@/lib/auth-guards";
import { sectionConfigString, sectionConfigNumber } from "@/lib/plan-data";
import type { ActionState } from "@/app/actions/auth";
import type { PlanTemplateSection } from "@/generated/prisma/client";

/**
 * Server Actions لتشغيل الخطط على المعمار العام (مرحلة ب) — كل دالة تتحقق
 * من الجلسة وملكية المدرسة للخطة قبل أي قراءة أو كتابة، بنفس انضباط
 * src/app/actions/wizard.ts.
 */

const createPlanSchema = z.object({
  templateId: z.string().trim().min(1),
  academicYear: z.string().trim().min(3, "اكتب السنة الدراسية"),
});

/** ينشئ خطة جديدة على قالب مُتاح، ويوجّه لأول قسم فيه. */
export async function createPlanAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();

  const parsed = createPlanSchema.safeParse({
    templateId: formData.get("templateId"),
    academicYear: formData.get("academicYear"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const template = await prisma.planTemplate.findUnique({
    where: { id: parsed.data.templateId },
    include: { sections: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!template || !template.isActive) {
    return { error: "القالب غير متاح" };
  }

  const existing = await prisma.plan.findUnique({
    where: {
      schoolId_templateId_academicYear: {
        schoolId,
        templateId: template.id,
        academicYear: parsed.data.academicYear,
      },
    },
  });
  if (existing) {
    redirect(`/plans/${existing.id}/${template.sections[0]?.key ?? ""}`);
  }

  const plan = await prisma.plan.create({
    data: { schoolId, templateId: template.id, academicYear: parsed.data.academicYear },
  });

  redirect(`/plans/${plan.id}/${template.sections[0]?.key ?? ""}`);
}

type SectionContext = {
  planId: string;
  templateId: string;
  sections: PlanTemplateSection[];
  section: PlanTemplateSection;
};

/** يتحقّق أن الخطة تابعة للمدرسة الحالية، وأن القسم المطلوب موجود فعلًا في قالبها. */
async function requireSectionContext(
  schoolId: string,
  planId: string,
  sectionKey: string
): Promise<SectionContext> {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, schoolId },
    include: { template: { include: { sections: { orderBy: { order: "asc" } } } } },
  });
  if (!plan) notFound();

  const section = plan.template.sections.find((s) => s.key === sectionKey);
  if (!section) notFound();

  return {
    planId: plan.id,
    templateId: plan.templateId,
    sections: plan.template.sections,
    section,
  };
}

/** يسجّل إتمام قسم، ويحدّث حالة الخطة (مسودة/قيد التنفيذ/مكتملة). */
async function markSectionComplete(planId: string, sectionKey: string, totalSections: number) {
  await prisma.planSectionProgress.upsert({
    where: { planId_sectionKey: { planId, sectionKey } },
    update: {},
    create: { planId, sectionKey },
  });

  const completedCount = await prisma.planSectionProgress.count({ where: { planId } });
  const status = completedCount >= totalSections ? "COMPLETE" : "IN_PROGRESS";
  await prisma.plan.update({ where: { id: planId }, data: { status } });
}

/** يوجّه للقسم التالي في القالب، أو للوحة المدرسة إن كان هذا آخر قسم. */
function redirectToNextSection(ctx: SectionContext): never {
  const index = ctx.sections.findIndex((s) => s.key === ctx.section.key);
  const next = ctx.sections[index + 1];
  redirect(next ? `/plans/${ctx.planId}/${next.key}` : "/dashboard");
}

/** STATIC_INFO — قسم تعريفي بلا إدخال، يُنجَز بمجرد المتابعة. */
export async function saveStaticInfoSectionAction(
  planId: string,
  sectionKey: string
): Promise<void> {
  const schoolId = await requireSchoolId();
  const ctx = await requireSectionContext(schoolId, planId, sectionKey);
  await markSectionComplete(planId, sectionKey, ctx.sections.length);
  redirectToNextSection(ctx);
}

/** OBJECTIVES_LIST — قائمة نصية قابلة للتكرار (استبدال كامل، كما في key_issues القديمة). */
export async function saveObjectivesListSectionAction(
  planId: string,
  sectionKey: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const ctx = await requireSectionContext(schoolId, planId, sectionKey);

  const items = formData
    .getAll("items")
    .map((v) => (v as string).trim())
    .filter(Boolean);

  await prisma.$transaction([
    prisma.planObjective.deleteMany({ where: { planId, sectionKey } }),
    prisma.planObjective.createMany({
      data: items.map((text, index) => ({ planId, sectionKey, text, order: index })),
    }),
  ]);

  await markSectionComplete(planId, sectionKey, ctx.sections.length);
  redirectToNextSection(ctx);
}

/** INDICATORS_LIST — مؤشر + قيمة مستهدفة + قيمة فعلية لكل هدف من قسم مصدر. */
export async function saveIndicatorsListSectionAction(
  planId: string,
  sectionKey: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const ctx = await requireSectionContext(schoolId, planId, sectionKey);

  const objectivesSectionKey = sectionConfigString(
    ctx.section.configJson,
    "objectivesSectionKey"
  );
  if (!objectivesSectionKey) {
    return { error: "إعداد القسم غير مكتمل — لا يوجد قسم أهداف مصدر" };
  }

  const objectives = await prisma.planObjective.findMany({
    where: { planId, sectionKey: objectivesSectionKey },
    select: { id: true },
  });

  await prisma.$transaction(
    objectives.map((o) => {
      const data = {
        indicator: ((formData.get(`indicator_${o.id}`) as string) ?? "").trim(),
        targetValue: ((formData.get(`target_${o.id}`) as string) ?? "").trim(),
        actualValue: ((formData.get(`actual_${o.id}`) as string) ?? "").trim(),
      };
      return prisma.planIndicator.upsert({
        where: { objectiveId_order: { objectiveId: o.id, order: 0 } },
        update: data,
        create: { objectiveId: o.id, order: 0, ...data },
      });
    })
  );

  await markSectionComplete(planId, sectionKey, ctx.sections.length);
  redirectToNextSection(ctx);
}

/** PROGRAMS_LIST — قائمة برامج/أنشطة قابلة للتكرار تحت كل هدف من قسم مصدر. */
export async function savePlanProgramsSectionAction(
  planId: string,
  sectionKey: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const ctx = await requireSectionContext(schoolId, planId, sectionKey);

  const objectivesSectionKey = sectionConfigString(
    ctx.section.configJson,
    "objectivesSectionKey"
  );
  if (!objectivesSectionKey) {
    return { error: "إعداد القسم غير مكتمل — لا يوجد قسم أهداف مصدر" };
  }
  const type = sectionConfigString(ctx.section.configJson, "typeValue") ?? "PROGRAM";

  const objectives = await prisma.planObjective.findMany({
    where: { planId, sectionKey: objectivesSectionKey },
    select: { id: true },
  });

  await prisma.$transaction(
    objectives.flatMap((o) => {
      const items = formData
        .getAll(`items_${o.id}`)
        .map((v) => (v as string).trim())
        .filter(Boolean);

      return [
        prisma.planProgram.deleteMany({ where: { objectiveId: o.id } }),
        prisma.planProgram.createMany({
          data: items.map((name, index) => ({ objectiveId: o.id, type, name, order: index })),
        }),
      ];
    })
  );

  await markSectionComplete(planId, sectionKey, ctx.sections.length);
  redirectToNextSection(ctx);
}

/** DETAIL_TABLE — تفاصيل تنفيذ + شاهد نصي لكل برنامج من قسم البرامج المصدر. */
export async function savePlanDetailSectionAction(
  planId: string,
  sectionKey: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const ctx = await requireSectionContext(schoolId, planId, sectionKey);

  const programsSectionKey = sectionConfigString(ctx.section.configJson, "programsSectionKey");
  if (!programsSectionKey) {
    return { error: "إعداد القسم غير مكتمل — لا يوجد قسم برامج مصدر" };
  }
  const programsSection = ctx.sections.find((s) => s.key === programsSectionKey);
  const objectivesSectionKey = sectionConfigString(
    programsSection?.configJson,
    "objectivesSectionKey"
  );
  if (!objectivesSectionKey) {
    return { error: "إعداد القسم غير مكتمل — تعذّر تحديد الأهداف المصدر" };
  }

  const programs = await prisma.planProgram.findMany({
    where: { objective: { planId, sectionKey: objectivesSectionKey } },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const p of programs) {
      const fields = {
        activity: ((formData.get(`activity_${p.id}`) as string) ?? "").trim(),
        targetCategory: ((formData.get(`category_${p.id}`) as string) ?? "").trim(),
        executionRequirements: ((formData.get(`requirements_${p.id}`) as string) ?? "").trim(),
        executionDate: ((formData.get(`date_${p.id}`) as string) ?? "").trim(),
        responsible: ((formData.get(`responsible_${p.id}`) as string) ?? "").trim(),
        supervisor: ((formData.get(`supervisor_${p.id}`) as string) ?? "").trim(),
        estimatedBudget: ((formData.get(`budget_${p.id}`) as string) ?? "").trim(),
        regulatorySecurityRequirements: (
          (formData.get(`regulatory_${p.id}`) as string) ?? ""
        ).trim(),
        planningNote: ((formData.get(`planningNote_${p.id}`) as string) ?? "").trim(),
      };
      const activity = await tx.planActivity.upsert({
        where: { programId_order: { programId: p.id, order: 0 } },
        update: fields,
        create: { programId: p.id, order: 0, ...fields },
      });

      const evidenceText = ((formData.get(`evidence_${p.id}`) as string) ?? "").trim();
      const existingEvidence = await tx.planEvidence.findFirst({
        where: { activityId: activity.id },
        orderBy: { order: "asc" },
      });
      if (existingEvidence) {
        await tx.planEvidence.update({
          where: { id: existingEvidence.id },
          data: { textValue: evidenceText },
        });
      } else if (evidenceText) {
        await tx.planEvidence.create({
          data: { activityId: activity.id, kind: "TEXT", textValue: evidenceText, order: 0 },
        });
      }
    }
  });

  await markSectionComplete(planId, sectionKey, ctx.sections.length);
  redirectToNextSection(ctx);
}

/**
 * WEEKLY_ACTIVITY_GRID — جدول أسبوعي (صف × أسبوع). عدد الأسابيع ثابت
 * (weeksCount من configJson)، وعدد الصفوف حرّ يحدده مدير المدرسة. هوية كل
 * صف "موضعية" بترتيب إرساله في النموذج (rowLabel_0..rowLabel_{n-1}) لا
 * بمعرّف ثابت — upsert بالترتيب بدل حذف/إعادة إنشاء الكل، حتى لا تُفقَد
 * خلايا صف لم يتغيّر ترتيبه لمجرّد تعديل صف آخر.
 */
export async function saveWeeklyGridSectionAction(
  planId: string,
  sectionKey: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const ctx = await requireSectionContext(schoolId, planId, sectionKey);

  const weeksCount = sectionConfigNumber(ctx.section.configJson, "weeksCount") ?? 18;
  const rowCount = Math.max(0, Math.min(200, Number(formData.get("rowCount")) || 0));

  await prisma.$transaction(async (tx) => {
    for (let week = 1; week <= weeksCount; week++) {
      const label = ((formData.get(`weekLabel_${week}`) as string) ?? "").trim();
      await tx.planGridWeek.upsert({
        where: { planId_sectionKey_order: { planId, sectionKey, order: week } },
        update: { label },
        create: { planId, sectionKey, order: week, label },
      });
    }

    for (let i = 0; i < rowCount; i++) {
      const label = ((formData.get(`rowLabel_${i}`) as string) ?? "").trim();
      const row = await tx.planGridRow.upsert({
        where: { planId_sectionKey_order: { planId, sectionKey, order: i } },
        update: { label },
        create: { planId, sectionKey, order: i, label },
      });

      for (let week = 1; week <= weeksCount; week++) {
        const content = ((formData.get(`cell_${i}_${week}`) as string) ?? "").trim();
        await tx.planGridCell.upsert({
          where: { rowId_weekOrder: { rowId: row.id, weekOrder: week } },
          update: { content },
          create: { rowId: row.id, weekOrder: week, content },
        });
      }
    }

    // صفوف زائدة تجاوزت العدد المُرسَل (حُذفت من الواجهة) — يحذف خلاياها
    // تلقائيًا بالـ cascade
    await tx.planGridRow.deleteMany({
      where: { planId, sectionKey, order: { gte: rowCount } },
    });
  });

  await markSectionComplete(planId, sectionKey, ctx.sections.length);
  redirectToNextSection(ctx);
}
