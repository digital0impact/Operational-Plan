"use server";

import { redirect, notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
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

/**
 * DETAIL_TABLE — تفاصيل تنفيذ + شاهد نصي لكل برنامج من قسم البرامج المصدر.
 *
 * استبدال كامل بدل upsert برنامج-بمعرّف: النموذج يرسل حقول كل برنامج
 * كاملة في كل حفظة (نفس منطق إصلاح saveWeeklyGridSectionAction)، فيُستبدَل
 * حذف/إنشاء متسلسل قد يبلغ 3 استعلامات لكل برنامج (upsert نشاط + بحث شاهد
 * + إنشاء/تحديث شاهد — قد يتجاوز مهلة المعاملة التفاعلية لخطة بعشرات
 * البرامج على قاعدة بيانات بعيدة الكمون) بحذف جماعي وإنشاء جماعي: استعلامان
 * إلى أربعة بصرف النظر عن عدد البرامج. المُعرِّفات الجديدة (randomUUID لا
 * cuid الافتراضي) مقبولة لأن الحقل `id String` عادي، والافتراضي يُطبَّق
 * فقط عند حذف القيمة من الإنشاء.
 */
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

  const activities = programs.map((p) => ({
    id: randomUUID(),
    programId: p.id,
    activity: ((formData.get(`activity_${p.id}`) as string) ?? "").trim(),
    targetCategory: ((formData.get(`category_${p.id}`) as string) ?? "").trim(),
    executionRequirements: ((formData.get(`requirements_${p.id}`) as string) ?? "").trim(),
    executionDate: ((formData.get(`date_${p.id}`) as string) ?? "").trim(),
    responsible: ((formData.get(`responsible_${p.id}`) as string) ?? "").trim(),
    supervisor: ((formData.get(`supervisor_${p.id}`) as string) ?? "").trim(),
    estimatedBudget: ((formData.get(`budget_${p.id}`) as string) ?? "").trim(),
    regulatorySecurityRequirements: ((formData.get(`regulatory_${p.id}`) as string) ?? "").trim(),
    planningNote: ((formData.get(`planningNote_${p.id}`) as string) ?? "").trim(),
    evidenceText: ((formData.get(`evidence_${p.id}`) as string) ?? "").trim(),
  }));

  await prisma.$transaction(async (tx) => {
    await tx.planActivity.deleteMany({ where: { programId: { in: programs.map((p) => p.id) } } });
    if (activities.length > 0) {
      await tx.planActivity.createMany({
        data: activities.map((a) => ({
          id: a.id,
          programId: a.programId,
          order: 0,
          activity: a.activity,
          targetCategory: a.targetCategory,
          executionRequirements: a.executionRequirements,
          executionDate: a.executionDate,
          responsible: a.responsible,
          supervisor: a.supervisor,
          estimatedBudget: a.estimatedBudget,
          regulatorySecurityRequirements: a.regulatorySecurityRequirements,
          planningNote: a.planningNote,
        })),
      });
      const evidenceRows = activities.filter((a) => a.evidenceText);
      if (evidenceRows.length > 0) {
        await tx.planEvidence.createMany({
          data: evidenceRows.map((a) => ({
            activityId: a.id,
            kind: "TEXT",
            textValue: a.evidenceText,
            order: 0,
          })),
        });
      }
    }
  });

  await markSectionComplete(planId, sectionKey, ctx.sections.length);
  redirectToNextSection(ctx);
}

/**
 * WEEKLY_ACTIVITY_GRID — جدول أسبوعي (صف × أسبوع). عدد الأسابيع ثابت
 * (weeksCount من configJson)، وعدد الصفوف حرّ يحدده مدير المدرسة.
 *
 * استبدال كامل بدل upsert صف-بصف: النموذج يرسل الحالة الكاملة (كل تسميات
 * الأسابيع وكل الصفوف وخلاياها) في كل حفظة، فلا خسارة بيانات من الحذف
 * والإعادة — ومعرّف الصف لا يتسرّب خارج هذا القسم أصلًا (PlanGridCell
 * الوحيد المرتبط به يُعاد إنشاؤه معه). هذا يقلّص العملية من upsert واحد لكل
 * (أسبوع) + upsert واحد لكل (صف) + upsert واحد لكل (صف × أسبوع) — قد
 * يتجاوز المئة استعلام متسلسل لجدول 18 أسبوعًا بضعة صفوف، فيتجاوز مهلة
 * المعاملة التفاعلية الافتراضية (5 ثوانٍ) على قواعد بيانات بعيدة الكمون
 * كـ Supabase — إلى عدد ثابت من استعلامات الحذف/الإنشاء الجماعي (٥ كحد
 * أقصى) بصرف النظر عن عدد الأسابيع أو الصفوف.
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

  const weekLabels = Array.from({ length: weeksCount }, (_, i) => {
    const order = i + 1;
    return { order, label: ((formData.get(`weekLabel_${order}`) as string) ?? "").trim() };
  }).filter((w) => w.label);

  const rows = Array.from({ length: rowCount }, (_, i) => {
    const cells = Array.from({ length: weeksCount }, (_, wi) => {
      const weekOrder = wi + 1;
      const content = ((formData.get(`cell_${i}_${weekOrder}`) as string) ?? "").trim();
      return { weekOrder, content };
    }).filter((c) => c.content);
    return {
      id: randomUUID(),
      order: i,
      label: ((formData.get(`rowLabel_${i}`) as string) ?? "").trim(),
      cells,
    };
  });

  await prisma.$transaction(async (tx) => {
    await tx.planGridWeek.deleteMany({ where: { planId, sectionKey } });
    if (weekLabels.length > 0) {
      await tx.planGridWeek.createMany({
        data: weekLabels.map((w) => ({ planId, sectionKey, order: w.order, label: w.label })),
      });
    }

    await tx.planGridRow.deleteMany({ where: { planId, sectionKey } });
    if (rows.length > 0) {
      await tx.planGridRow.createMany({
        data: rows.map((r) => ({ id: r.id, planId, sectionKey, order: r.order, label: r.label })),
      });
      const cells = rows.flatMap((r) =>
        r.cells.map((c) => ({ rowId: r.id, weekOrder: c.weekOrder, content: c.content }))
      );
      if (cells.length > 0) {
        await tx.planGridCell.createMany({ data: cells });
      }
    }
  });

  await markSectionComplete(planId, sectionKey, ctx.sections.length);
  redirectToNextSection(ctx);
}

/**
 * PROGRAM_WEEK_TAGS — يربط كل برنامج بأسبوع أو أكثر من أسابيع "الخطة
 * الفصلية" (استبدال كامل لأسابيع كل برنامج في كل حفظة، لا إضافة تراكمية).
 * حذف جماعي بمرشِّح `programId IN (...)` ثم إنشاء جماعي واحد بدل حلقة
 * حذف/إنشاء لكل برنامج — استعلامان ثابتان بصرف النظر عن عدد البرامج،
 * بنفس منطق إصلاح saveWeeklyGridSectionAction لمهلة المعاملة التفاعلية.
 */
export async function saveProgramWeekTagsSectionAction(
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

  const tags = programs.flatMap((p) => {
    const weeks = formData
      .getAll(`weeks_${p.id}`)
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n > 0);
    return weeks.map((weekOrder) => ({ programId: p.id, weekOrder }));
  });

  await prisma.$transaction([
    prisma.planProgramWeekTag.deleteMany({
      where: { programId: { in: programs.map((p) => p.id) } },
    }),
    ...(tags.length > 0 ? [prisma.planProgramWeekTag.createMany({ data: tags })] : []),
  ]);

  await markSectionComplete(planId, sectionKey, ctx.sections.length);
  redirectToNextSection(ctx);
}
