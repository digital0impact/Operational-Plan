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

/** يقرأ قيمة رقمية من configJson لقسم قالب — يُعيد undefined إن غابت أو لم تكن رقمًا. */
export function sectionConfigNumber(
  configJson: unknown,
  key: string
): number | undefined {
  if (configJson && typeof configJson === "object" && key in configJson) {
    const value = (configJson as Record<string, unknown>)[key];
    return typeof value === "number" ? value : undefined;
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
      planTypeId: plan.template.planType.id,
      planTypeName: plan.template.planType.nameAr,
      totalSections,
      completedSections,
      progressPercent:
        totalSections === 0 ? 0 : Math.round((completedSections / totalSections) * 100),
      nextSectionKey: firstIncomplete,
      firstSectionKey: plan.template.sections[0]?.key,
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
        supervisor: activity?.supervisor ?? "",
        estimatedBudget: activity?.estimatedBudget ?? "",
        regulatorySecurityRequirements: activity?.regulatorySecurityRequirements ?? "",
        planningNote: activity?.planningNote ?? "",
        evidence: activity?.evidence[0]?.textValue ?? "",
      };
    }),
  }));
}

/**
 * PROGRAM_WEEK_TAGS: نفس تسلسل حلّ programsSectionKey←objectivesSectionKey
 * في getDetailPlanData، لكن تُحمَّل معه أسابيع "الخطة الفصلية" الموسومة
 * لكل برنامج (PlanProgramWeekTag) بدل نشاطه التنفيذي — برنامج واحد قد
 * يتكرر في أكثر من أسبوع.
 */
export async function getProgramWeekTagsData(
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
        include: { weekTags: true },
      },
    },
  });

  return objectives.map((o) => ({
    objectiveId: o.id,
    text: o.text,
    programs: o.programs.map((p) => ({
      programId: p.id,
      name: p.name,
      weeks: p.weekTags.map((t) => t.weekOrder),
    })),
  }));
}

/**
 * جدول أسبوعي (WEEKLY_ACTIVITY_GRID): عدد الأسابيع ثابت (weeksCount) وعدد
 * الصفوف حرّ يحدده مدير المدرسة. تُبنى أعمدة الأسابيع دائمًا كاملة العدد
 * (1..weeksCount) حتى لو لم تُحفَظ تسمياتها بعد، ليعرضها النموذج فارغة
 * بدل أن تختفي.
 */
export async function getWeeklyGridData(
  planId: string,
  sectionKey: string,
  weeksCount: number
) {
  const [rows, weeks] = await Promise.all([
    prisma.planGridRow.findMany({
      where: { planId, sectionKey },
      orderBy: { order: "asc" },
      include: { cells: true },
    }),
    prisma.planGridWeek.findMany({
      where: { planId, sectionKey },
      orderBy: { order: "asc" },
    }),
  ]);

  const weekLabels = new Map(weeks.map((w) => [w.order, w.label]));
  const weekColumns = Array.from({ length: weeksCount }, (_, i) => ({
    order: i + 1,
    label: weekLabels.get(i + 1) ?? "",
  }));

  return {
    weeks: weekColumns,
    rows: rows.map((r) => {
      const cellsByWeek = new Map(r.cells.map((c) => [c.weekOrder, c.content]));
      return {
        id: r.id,
        order: r.order,
        label: r.label,
        cells: Array.from({ length: weeksCount }, (_, i) => cellsByWeek.get(i + 1) ?? ""),
      };
    }),
  };
}

type CombinedCalendarSource = { planTypeKey: string; label: string; color: string };
type CombinedCalendarRowConfig = { key: string; titleAr: string; sources: CombinedCalendarSource[] };

function parseCombinedCalendarRows(configJson: unknown): CombinedCalendarRowConfig[] {
  if (
    configJson &&
    typeof configJson === "object" &&
    "rows" in configJson &&
    Array.isArray((configJson as Record<string, unknown>).rows)
  ) {
    return (configJson as { rows: CombinedCalendarRowConfig[] }).rows;
  }
  return [];
}

/**
 * يحمّل برامج نوع خطة مصدر (بالاسم + أسابيعها المُوسومة) لمدرسة وسنة
 * دراسية معيّنتين — يُستخدَم في تجميع "الخطة الفصلية". يبحث تلقائيًا عن
 * أول قسم PROGRAMS_LIST في قالب ذلك النوع (بدل افتراض مفتاح ثابت "programs"،
 * حتى لو تغيّر مستقبلًا). يُعيد [] إن لم توجد خطة من هذا النوع لنفس
 * المدرسة/السنة بعد (لم تُنشَأ، أو أُنشئت بقالب بلا قسم برامج).
 */
async function loadSourcePrograms(schoolId: string, academicYear: string, planTypeKey: string) {
  const plan = await prisma.plan.findFirst({
    where: { schoolId, academicYear, template: { planType: { key: planTypeKey } } },
    include: { template: { include: { sections: true } } },
  });
  if (!plan) return [];

  const programsSection = plan.template.sections.find((s) => s.kind === "PROGRAMS_LIST");
  if (!programsSection) return [];

  const objectivesSectionKey = sectionConfigString(
    programsSection.configJson,
    "objectivesSectionKey"
  );
  if (!objectivesSectionKey) return [];

  const objectives = await prisma.planObjective.findMany({
    where: { planId: plan.id, sectionKey: objectivesSectionKey },
    include: { programs: { include: { weekTags: true } } },
  });

  return objectives.flatMap((o) =>
    o.programs.map((p) => ({ name: p.name, weeks: p.weekTags.map((t) => t.weekOrder) }))
  );
}

export type CombinedCalendarComputedRow = {
  titleAr: string;
  legend: { label: string; color: string }[];
  weeks: { weekOrder: number; items: { text: string; color: string }[] }[];
};

/**
 * قسم COMBINED_CALENDAR — "الخطة الفصلية": صفوف مُشتقّة تلقائيًا (computedRows،
 * من برامج خطط مصدر أخرى لنفس المدرسة والسنة الدراسية، مُوسومة بأسبوعها عبر
 * PROGRAM_WEEK_TAGS) مدموجة مع صفوف تُدخَل يدويًا هنا (valueRows، مثل "القيم"
 * التي لا خطة مصدر لها) — تُخزَّن الأخيرة وتسميات الأعمدة بنفس آلية
 * WEEKLY_ACTIVITY_GRID (PlanGridRow/PlanGridWeek/PlanGridCell)، فتُعاد
 * استخدامها كما هي (getWeeklyGridData وsaveWeeklyGridSectionAction).
 */
async function computeCombinedCalendar(
  schoolId: string,
  planId: string,
  academicYear: string,
  section: { key: string; configJson: unknown }
) {
  const weeksCount = sectionConfigNumber(section.configJson, "weeksCount") ?? 14;
  const rowsConfig = parseCombinedCalendarRows(section.configJson);

  const computedRows: CombinedCalendarComputedRow[] = await Promise.all(
    rowsConfig.map(async (rc) => {
      const sourceResults = await Promise.all(
        rc.sources.map(async (src) => ({
          color: src.color,
          label: src.label,
          programs: await loadSourcePrograms(schoolId, academicYear, src.planTypeKey),
        }))
      );
      const weeks = Array.from({ length: weeksCount }, (_, i) => {
        const weekOrder = i + 1;
        const items = sourceResults.flatMap((sr) =>
          sr.programs
            .filter((p) => p.weeks.includes(weekOrder))
            .map((p) => ({ text: p.name, color: sr.color }))
        );
        return { weekOrder, items };
      });
      return {
        titleAr: rc.titleAr,
        legend: sourceResults.map((sr) => ({ label: sr.label, color: sr.color })),
        weeks,
      };
    })
  );

  const grid = await getWeeklyGridData(planId, section.key, weeksCount);

  return { weeksCount, weeks: grid.weeks, computedRows, valueRows: grid.rows };
}

/** يحمّل بيانات "الخطة الفصلية" لعرضها في صفحة القسم — يتحقّق من ملكية
 * المدرسة عبر loadPlanShell، ويعيد null إن لم توجد الخطة أو لم يوجد فيها
 * قسم COMBINED_CALENDAR. */
export async function getCombinedCalendarData(schoolId: string, planId: string) {
  const shell = await loadPlanShell(schoolId, planId);
  if (!shell) return null;
  const section = shell.sections.find((s) => s.kind === "COMBINED_CALENDAR");
  if (!section) return null;
  return computeCombinedCalendar(schoolId, planId, shell.academicYear, section);
}

export type PlanExportSection =
  | { kind: "STATIC_INFO"; key: string; titleAr: string; description: string }
  | { kind: "OBJECTIVES_LIST"; key: string; titleAr: string; items: string[] }
  | {
      kind: "INDICATORS_LIST";
      key: string;
      titleAr: string;
      rows: Awaited<ReturnType<typeof getIndicatorsData>>;
    }
  | {
      kind: "PROGRAMS_LIST";
      key: string;
      titleAr: string;
      objectives: { order: number; text: string; programs: string[] }[];
    }
  | {
      kind: "DETAIL_TABLE";
      key: string;
      titleAr: string;
      objectives: Awaited<ReturnType<typeof getDetailPlanData>>;
    }
  | {
      kind: "WEEKLY_ACTIVITY_GRID";
      key: string;
      titleAr: string;
      grid: Awaited<ReturnType<typeof getWeeklyGridData>>;
    }
  | {
      kind: "COMBINED_CALENDAR";
      key: string;
      titleAr: string;
      calendar: Awaited<ReturnType<typeof computeCombinedCalendar>>;
    };

export type PlanExportData = {
  schoolName: string;
  schoolUnit: string;
  schoolSystem: string;
  schoolGender: string;
  planTypeName: string;
  academicYear: string;
  generatedAt: Date;
  sections: PlanExportSection[];
};

/**
 * يبني بيانات تصدير قسم واحد من أقسام قالب خطة — مستخرَج ليُشترَك بين تصدير
 * الخطة الكاملة (getPlanExportData) وتصدير قسم واحد بمعزل عن الباقي
 * (getSectionExportData). يعيد null لأنواع أقسام خاصة بالخطة التشغيلية
 * القديمة (SWOT_GRID وغيرها) لا تُستخدَم في قوالب المعمار العام.
 */
async function buildExportSection(
  templateId: string,
  planId: string,
  section: { key: string; titleAr: string; kind: string; configJson: unknown },
  schoolId: string,
  academicYear: string
): Promise<PlanExportSection | null> {
  switch (section.kind) {
    case "STATIC_INFO":
      return {
        kind: "STATIC_INFO",
        key: section.key,
        titleAr: section.titleAr,
        description: sectionConfigString(section.configJson, "description") ?? "",
      };
    case "OBJECTIVES_LIST": {
      const items = await getObjectivesForSection(planId, section.key);
      return {
        kind: "OBJECTIVES_LIST",
        key: section.key,
        titleAr: section.titleAr,
        items: items.map((i) => i.text),
      };
    }
    case "INDICATORS_LIST": {
      const objectivesSectionKey = sectionConfigString(section.configJson, "objectivesSectionKey");
      const rows = objectivesSectionKey
        ? await getIndicatorsData(planId, objectivesSectionKey)
        : [];
      return { kind: "INDICATORS_LIST", key: section.key, titleAr: section.titleAr, rows };
    }
    case "PROGRAMS_LIST": {
      const objectivesSectionKey = sectionConfigString(section.configJson, "objectivesSectionKey");
      const data = objectivesSectionKey ? await getProgramsData(planId, objectivesSectionKey) : [];
      return {
        kind: "PROGRAMS_LIST",
        key: section.key,
        titleAr: section.titleAr,
        objectives: data.map((o) => ({
          order: o.order,
          text: o.text,
          programs: o.programs.map((p) => p.name),
        })),
      };
    }
    case "DETAIL_TABLE": {
      const programsSectionKey = sectionConfigString(section.configJson, "programsSectionKey");
      const objectives = programsSectionKey
        ? await getDetailPlanData(templateId, planId, programsSectionKey)
        : [];
      return { kind: "DETAIL_TABLE", key: section.key, titleAr: section.titleAr, objectives };
    }
    case "WEEKLY_ACTIVITY_GRID": {
      const weeksCount = sectionConfigNumber(section.configJson, "weeksCount") ?? 18;
      const grid = await getWeeklyGridData(planId, section.key, weeksCount);
      return { kind: "WEEKLY_ACTIVITY_GRID", key: section.key, titleAr: section.titleAr, grid };
    }
    case "COMBINED_CALENDAR": {
      const calendar = await computeCombinedCalendar(schoolId, planId, academicYear, section);
      return { kind: "COMBINED_CALENDAR", key: section.key, titleAr: section.titleAr, calendar };
    }
    default:
      return null;
  }
}

/**
 * يجمّع بيانات خطة كاملة (على المعمار العام) بترتيب أقسام قالبها، جاهزة
 * لبناء PDF عام يغطي أنواع الأقسام الخمسة المُنفَّذة — يعيد null إن لم توجد
 * الخطة أو لم تكن ملكًا لهذه المدرسة (نفس تحقّق الملكية في loadPlanShell).
 */
export async function getPlanExportData(
  schoolId: string,
  planId: string
): Promise<PlanExportData | null> {
  const shell = await loadPlanShell(schoolId, planId);
  if (!shell) return null;

  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });

  const sections: PlanExportSection[] = [];
  for (const section of shell.sections) {
    const built = await buildExportSection(
      shell.templateId,
      planId,
      section,
      schoolId,
      shell.academicYear
    );
    if (built) sections.push(built);
  }

  return {
    schoolName: school.name,
    schoolUnit: school.unit,
    schoolSystem: school.schoolSystem,
    schoolGender: school.gender,
    planTypeName: shell.planType.nameAr,
    academicYear: shell.academicYear,
    generatedAt: new Date(),
    sections,
  };
}

export type SectionExportData = {
  schoolName: string;
  schoolUnit: string;
  schoolSystem: string;
  schoolGender: string;
  planTypeName: string;
  academicYear: string;
  generatedAt: Date;
  section: PlanExportSection;
};

/**
 * يجمّع بيانات قسم واحد بمعزل عن باقي أقسام الخطة — لتنزيله كملف PDF
 * مستقل (مثلًا الجدول الأسبوعي وحده دون بقية خطة النشاط الطلابي). يعيد
 * null إن لم توجد الخطة، لم تكن ملكًا لهذه المدرسة، لم يوجد القسم في
 * قالبها، أو كان نوعه غير مدعوم في التصدير.
 */
export async function getSectionExportData(
  schoolId: string,
  planId: string,
  sectionKey: string
): Promise<SectionExportData | null> {
  const shell = await loadPlanShell(schoolId, planId);
  if (!shell) return null;

  const section = shell.sections.find((s) => s.key === sectionKey);
  if (!section) return null;

  const built = await buildExportSection(
    shell.templateId,
    planId,
    section,
    schoolId,
    shell.academicYear
  );
  if (!built) return null;

  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });

  return {
    schoolName: school.name,
    schoolUnit: school.unit,
    schoolSystem: school.schoolSystem,
    schoolGender: school.gender,
    planTypeName: shell.planType.nameAr,
    academicYear: shell.academicYear,
    generatedAt: new Date(),
    section: built,
  };
}
