"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { PLAN_SECTION_KINDS } from "@/lib/constants";
import type { ActionState } from "@/app/actions/auth";

/**
 * Server Actions لإدارة أنواع الخطط وقوالبها وأقسامها من `/admin/plan-types`
 * (مرحلة أ من خطة المعمار). هذه الجداول لا يقرأها معالج `/wizard` الحالي —
 * إدارتها هنا آمنة تمامًا ولا تؤثر على الخطة التشغيلية القائمة.
 */

const slugPattern = /^[a-z][a-z0-9_]*$/;

const createPlanTypeSchema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(slugPattern, "المعرّف يجب أن يبدأ بحرف إنجليزي صغير ويحوي أحرفًا صغيرة وأرقامًا و_ فقط"),
  nameAr: z.string().trim().min(2, "اكتب اسم نوع الخطة بالعربية"),
  nameEn: z.string().trim().min(2, "اكتب اسم نوع الخطة بالإنجليزية"),
});

/** ينشئ نوع خطة جديدًا مع قالبه الأول (نسخة 1، فعّال) في معاملة واحدة. */
export async function createPlanTypeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = createPlanTypeSchema.safeParse({
    key: formData.get("key"),
    nameAr: formData.get("nameAr"),
    nameEn: formData.get("nameEn"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const existing = await prisma.planType.findUnique({
    where: { key: parsed.data.key },
  });
  if (existing) {
    return { error: "هذا المعرّف مستخدم بالفعل لنوع خطة آخر" };
  }

  await prisma.$transaction(async (tx) => {
    const planType = await tx.planType.create({ data: parsed.data });
    await tx.planTemplate.create({
      data: { planTypeId: planType.id, version: 1, isActive: true },
    });
  });

  redirect("/admin/plan-types");
}

/** يحذف نوع خطة بكل قوالبه وأقسامه (Cascade). لا يمسّ أي مدرسة أو خطة قائمة. */
export async function deletePlanTypeAction(id: string): Promise<void> {
  await requireAdmin();
  await prisma.planType.delete({ where: { id } });
  redirect("/admin/plan-types");
}

const sectionKindValues = PLAN_SECTION_KINDS.map((k) => k.value) as [
  string,
  ...string[],
];

const addSectionSchema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(slugPattern, "معرّف القسم يجب أن يبدأ بحرف إنجليزي صغير ويحوي أحرفًا صغيرة وأرقامًا و_ فقط"),
  titleAr: z.string().trim().min(2, "اكتب عنوان القسم بالعربية"),
  // titleEn حقل اختياري لا يوجد له إدخال في النموذج حاليًا، فـ
  // formData.get("titleEn") يُعيد null دائمًا (لا "" ولا undefined) —
  // نفس الفخ الموثَّق في optionalEnum بـ wizard.ts. المعالجة المسبقة هنا
  // توحّد null/""/undefined إلى undefined قبل التحقق.
  titleEn: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim().length > 0 ? v : undefined),
      z.string().trim().optional()
    )
    .transform((v) => v ?? null),
  kind: z.enum(sectionKindValues, { message: "اختر نوع القسم" }),
  order: z.coerce.number().int().min(0).default(0),
});

/** يضيف قسمًا جديدًا لقالب قائم. */
export async function addTemplateSectionAction(
  templateId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = addSectionSchema.safeParse({
    key: formData.get("key"),
    titleAr: formData.get("titleAr"),
    titleEn: formData.get("titleEn"),
    kind: formData.get("kind"),
    order: formData.get("order"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const template = await prisma.planTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) {
    return { error: "القالب غير موجود" };
  }

  const existing = await prisma.planTemplateSection.findUnique({
    where: { templateId_key: { templateId, key: parsed.data.key } },
  });
  if (existing) {
    return { error: "معرّف القسم مستخدم بالفعل ضمن هذا القالب" };
  }

  await prisma.planTemplateSection.create({
    data: { templateId, ...parsed.data },
  });

  redirect("/admin/plan-types");
}

/** يحذف قسمًا من قالب. */
export async function deleteTemplateSectionAction(id: string): Promise<void> {
  await requireAdmin();
  await prisma.planTemplateSection.delete({ where: { id } });
  redirect("/admin/plan-types");
}
