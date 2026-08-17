import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateStructured, type AiResult } from "@/lib/ai/generate";
import { sectionConfigString } from "@/lib/plan-data";
import {
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
  SWOT_CATEGORIES,
  INITIATIVE_TYPES,
  findLabel,
} from "@/lib/constants";

/**
 * دوال توليد الاقتراحات الخمس (نقاط التكامل المخطَّطة): هدف تشغيلي، مؤشر
 * وقيمة مستهدفة، بنود SWOT، قضايا رئيسية، وتفاصيل تنفيذ مبادرة/برنامج.
 * كل دالة تجلب سياق المدرسة اللازم من قاعدة البيانات ثم تستدعي Claude عبر
 * generateStructured مع مخطط Zod يفرض شكل الاستجابة (structured outputs).
 */

const SYSTEM_PROMPT =
  "أنت مساعد متخصص في إعداد الخطط التشغيلية لمدارس التعليم العام في المملكة " +
  "العربية السعودية، وفق «دليل إجراءات عمل مدارس التعليم العام» (الإجراء " +
  "س-1-أ-1). تكتب دائمًا بالعربية الفصحى، بأسلوب مهني موجز يصلح للإدراج " +
  "المباشر داخل وثيقة رسمية، دون مقدمات أو شروح أو تعليقات إضافية.";

type SchoolContext = {
  name: string;
  gender: string;
  schoolSystem: string;
  unit: string;
};

function schoolContextLine(school: SchoolContext): string {
  return (
    `بيانات المدرسة: "${school.name}" — ` +
    `${findLabel(SCHOOL_GENDER_OPTIONS, school.gender)}، ` +
    `${findLabel(SCHOOL_CLASSIFICATION_OPTIONS, school.schoolSystem)}، ` +
    `${findLabel(SCHOOL_STAGE_OPTIONS, school.unit)}.`
  );
}

function existingItemsBlock(label: string, items: string[]): string {
  if (items.length === 0) return "";
  return `\n${label} المُدخَلة مسبقًا (لا تكرر مضمونها): ${items
    .map((item) => `"${item}"`)
    .join("، ")}`;
}

// ── 1) صياغة الهدف التشغيلي (خطوة 6) ──────────────────────────────────

const operationalGoalSchema = z.object({
  operationalGoal: z
    .string()
    .min(10)
    .describe("جملة أو جملتان تصف هدفًا تشغيليًا واحدًا محددًا وقابلًا للقياس"),
});

export async function suggestOperationalGoal(
  schoolId: string,
  strategicGoalId: string
): Promise<AiResult<{ operationalGoal: string }>> {
  const [school, strategicGoal] = await Promise.all([
    prisma.school.findUniqueOrThrow({ where: { id: schoolId } }),
    prisma.strategicGoal.findUniqueOrThrow({ where: { id: strategicGoalId } }),
  ]);

  const prompt = `${schoolContextLine(school)}

الهدف الاستراتيجي الصادر عن وزارة التعليم رقم ${strategicGoal.order}: "${strategicGoal.title}"

اقترح هدفًا تشغيليًا واحدًا تتبناه هذه المدرسة تحديدًا لتحقيق هذا الهدف
الاستراتيجي خلال العام الدراسي، بصياغة إجرائية واضحة وقابلة للقياس.`;

  return generateStructured(SYSTEM_PROMPT, prompt, operationalGoalSchema);
}

// ── 2) مؤشر قياس الأداء والقيمة المستهدفة (خطوتان 7-8) ─────────────────

const kpiSchema = z.object({
  indicator: z.string().min(3).describe("مؤشر قياس أداء واحد محدد وقابل للقياس"),
  targetValue: z
    .string()
    .min(1)
    .describe("القيمة المستهدفة لهذا المؤشر (نسبة مئوية أو عدد أو وصف مختصر)"),
});

export async function suggestKpi(
  schoolId: string,
  operationalGoalId: string
): Promise<AiResult<{ indicator: string; targetValue: string }>> {
  const [school, goal] = await Promise.all([
    prisma.school.findUniqueOrThrow({ where: { id: schoolId } }),
    prisma.operationalGoal.findUniqueOrThrow({
      where: { id: operationalGoalId },
      include: { strategicGoal: true },
    }),
  ]);

  const prompt = `${schoolContextLine(school)}

الهدف الاستراتيجي: "${goal.strategicGoal.title}"
الهدف التشغيلي للمدرسة: "${goal.text || "لم يُصَغ بعد — استند إلى الهدف الاستراتيجي"}"

اقترح مؤشر قياس أداء واحدًا لهذا الهدف التشغيلي، مع قيمة مستهدفة واقعية
لهذا العام الدراسي.`;

  return generateStructured(SYSTEM_PROMPT, prompt, kpiSchema);
}

// ── 3) تحليل SWOT (خطوات 9-12) ──────────────────────────────────────

const swotSchema = z.object({
  items: z
    .array(z.string().min(3))
    .min(3)
    .max(5)
    .describe("بنود قصيرة، بند واحد لكل سطر"),
});

export async function suggestSwotItems(
  schoolId: string,
  category: "STRENGTH" | "WEAKNESS" | "OPPORTUNITY" | "THREAT"
): Promise<AiResult<{ items: string[] }>> {
  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });
  const swotItems = await prisma.swotItem.findMany({
    where: { schoolId },
    orderBy: { order: "asc" },
  });

  const categoryMeta = SWOT_CATEGORIES.find((c) => c.value === category)!;
  const hints: Record<string, string> = {
    STRENGTH: "الجوانب الداخلية التي تتميز بها المدرسة حاليًا",
    WEAKNESS: "الجوانب الداخلية التي تحتاج إلى تحسين داخل المدرسة",
    OPPORTUNITY: "العوامل الخارجية التي يمكن للمدرسة الاستفادة منها",
    THREAT: "العوامل الخارجية التي قد تؤثر سلبًا على المدرسة",
  };

  const existing = swotItems
    .filter((item) => item.category === category)
    .map((item) => item.text);
  const otherCategoriesContext = swotItems
    .filter((item) => item.category !== category)
    .map(
      (item) =>
        `- (${findLabel(SWOT_CATEGORIES, item.category)}) ${item.text}`
    )
    .join("\n");

  const prompt = `${schoolContextLine(school)}

المطلوب: اقترح 3 إلى 5 بنود ضمن محور "${categoryMeta.label}" في تحليل SWOT،
أي: ${hints[category]}.
اكتب كل بند كعبارة قصيرة ومحددة (وليست جملة عامة إنشائية).${existingItemsBlock(
    "بنود هذا المحور",
    existing
  )}${
    otherCategoriesContext
      ? `\n\nبنود أُدخلت في محاور SWOT الأخرى لهذه المدرسة (للاستئناس بسياق واقعها فقط):\n${otherCategoriesContext}`
      : ""
  }`;

  return generateStructured(SYSTEM_PROMPT, prompt, swotSchema);
}

// ── 4) ترشيح القضايا الرئيسية (خطوة 13) ────────────────────────────

const keyIssuesSchema = z.object({
  items: z
    .array(z.string().min(5))
    .min(2)
    .max(5)
    .describe("قضايا رئيسية مستخلصة من نقاط الضعف والتهديدات"),
});

export async function suggestKeyIssues(
  schoolId: string
): Promise<AiResult<{ items: string[] }>> {
  const [school, swotItems, existingIssues] = await Promise.all([
    prisma.school.findUniqueOrThrow({ where: { id: schoolId } }),
    prisma.swotItem.findMany({
      where: { schoolId, category: { in: ["WEAKNESS", "THREAT"] } },
      orderBy: { order: "asc" },
    }),
    prisma.keyIssue.findMany({ where: { schoolId }, orderBy: { order: "asc" } }),
  ]);

  if (swotItems.length === 0) {
    return {
      ok: false,
      error: "أكمل تحليل SWOT (نقاط الضعف والتهديدات) أولًا حتى يتمكن الذكاء الاصطناعي من ترشيح القضايا الرئيسية.",
    };
  }

  const weaknesses = swotItems.filter((i) => i.category === "WEAKNESS").map((i) => i.text);
  const threats = swotItems.filter((i) => i.category === "THREAT").map((i) => i.text);

  const prompt = `${schoolContextLine(school)}

نقاط الضعف المرصودة:
${weaknesses.map((w) => `- ${w}`).join("\n") || "(لا يوجد)"}

التهديدات المرصودة:
${threats.map((t) => `- ${t}`).join("\n") || "(لا يوجد)"}

استخلص القضايا الرئيسية التي تواجه المدرسة استنادًا إلى ما سبق فقط — كل
قضية عبارة قصيرة ومحددة تصلح لأن تُعالَج لاحقًا بمبادرات وبرامج.${existingItemsBlock(
    "القضايا",
    existingIssues.map((i) => i.text)
  )}`;

  return generateStructured(SYSTEM_PROMPT, prompt, keyIssuesSchema);
}

// ── 5) صياغة الأنشطة والشواهد لمبادرة/برنامج (خطوات 16-25) ────────────

const actionItemSchema = z.object({
  activity: z.string().min(5).describe("وصف الأنشطة التنفيذية لهذه المبادرة/البرنامج"),
  targetCategory: z.string().min(2).describe("الفئة المستهدفة (مثال: الطالبات، المعلمون، أولياء الأمور)"),
  executionRequirements: z.string().min(2).describe("متطلبات التنفيذ (موارد، اعتمادات، تجهيزات)"),
  executionDate: z.string().min(2).describe("توقيت التنفيذ (مثال: الفصل الدراسي الأول)"),
  responsible: z.string().min(2).describe("الجهة أو الفريق المسؤول عن التنفيذ والمتابعة"),
  evidence: z.string().min(2).describe("الشواهد التي تُثبت التنفيذ (مثال: تقرير، محضر، سجل حضور)"),
});

export type ActionItemSuggestion = z.infer<typeof actionItemSchema>;

export async function suggestActionItem(
  schoolId: string,
  initiativeId: string
): Promise<AiResult<ActionItemSuggestion>> {
  const [school, initiative] = await Promise.all([
    prisma.school.findUniqueOrThrow({ where: { id: schoolId } }),
    prisma.initiativeProgram.findUniqueOrThrow({
      where: { id: initiativeId },
      include: { operationalGoal: { include: { strategicGoal: true } } },
    }),
  ]);

  if (initiative.operationalGoal.schoolId !== schoolId) {
    return { ok: false, error: "لا تملك صلاحية الوصول لهذه المبادرة." };
  }

  const typeLabel = INITIATIVE_TYPES[initiative.type as "INITIATIVE" | "PROGRAM"]?.label ?? initiative.type;

  const prompt = `${schoolContextLine(school)}

الهدف الاستراتيجي: "${initiative.operationalGoal.strategicGoal.title}"
الهدف التشغيلي: "${initiative.operationalGoal.text || "—"}"
${typeLabel}: "${initiative.name}"

اكتب خطة تنفيذ مختصرة لهذا/هذه ${typeLabel} ضمن الجدول التفصيلي للخطة
التشغيلية: الأنشطة، الفئة المستهدفة، متطلبات التنفيذ، توقيت التنفيذ،
الجهة المسؤولة، والشواهد.`;

  return generateStructured(SYSTEM_PROMPT, prompt, actionItemSchema);
}

// ── 6) عناصر قسم OBJECTIVES_LIST عام (أي نوع خطة على المعمار العام) ────
// نطاقها أوسع من الخطة التشغيلية (لا "الإجراء س-1-أ-1" تحديدًا)، فلها
// موجّه نظام أعم بدل SYSTEM_PROMPT أعلاه — عارض OBJECTIVES_LIST واحد يخدم
// كل الأنواع، فدالة اقتراح واحدة تكفي بدل دالة لكل نوع.

const GENERIC_PLAN_SYSTEM_PROMPT =
  "أنت مساعد متخصص في إعداد خطط مدارس التعليم العام في المملكة العربية " +
  "السعودية، وفق «دليل إجراءات عمل مدارس التعليم العام» (الإصدار الرابع، " +
  "رجب 1446هـ/يناير 2025م). تكتب دائمًا بالعربية الفصحى، بأسلوب مهني موجز " +
  "يصلح للإدراج المباشر داخل وثيقة رسمية، دون مقدمات أو شروح أو تعليقات إضافية.";

const genericObjectivesSchema = z.object({
  items: z
    .array(z.string().min(3))
    .min(3)
    .max(5)
    .describe("عناصر قصيرة ومحددة، عنصر واحد لكل سطر"),
});

export async function suggestObjectivesListItems(
  schoolId: string,
  planId: string,
  sectionKey: string
): Promise<AiResult<{ items: string[] }>> {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, schoolId },
    include: { template: { include: { planType: true, sections: true } } },
  });
  if (!plan) {
    return { ok: false, error: "الخطة غير موجودة." };
  }
  const section = plan.template.sections.find((s) => s.key === sectionKey);
  if (!section) {
    return { ok: false, error: "القسم غير موجود." };
  }

  const [school, existing] = await Promise.all([
    prisma.school.findUniqueOrThrow({ where: { id: schoolId } }),
    prisma.planObjective.findMany({
      where: { planId, sectionKey },
      orderBy: { order: "asc" },
    }),
  ]);

  const itemLabel = sectionConfigString(section.configJson, "itemLabel") ?? "عنصر";

  const prompt = `${schoolContextLine(school)}

نوع الخطة: "${plan.template.planType.nameAr}"
القسم الحالي: "${section.titleAr}" — كل عنصر فيه من نوع "${itemLabel}"

اقترح 3 إلى 5 عناصر من نوع "${itemLabel}" مناسبة لهذه الخطة ولهذه المدرسة،
بصياغة موجزة ومحددة تصلح للإدراج المباشر داخل وثيقة رسمية.${existingItemsBlock(
    "عناصر هذا القسم المُدخَلة مسبقًا",
    existing.map((i) => i.text)
  )}`;

  return generateStructured(GENERIC_PLAN_SYSTEM_PROMPT, prompt, genericObjectivesSchema);
}
