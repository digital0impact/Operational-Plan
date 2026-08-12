"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  BUILDING_INDEPENDENCE_OPTIONS,
  BUILDING_TYPE_OPTIONS,
  PERFORMANCE_LEVEL_OPTIONS,
  PROCEDURE_INPUTS,
  STUDY_TIME_OPTIONS,
  TOTAL_WIZARD_STEPS,
} from "@/lib/constants";
import type { ActionState } from "@/app/actions/auth";

async function requireSchoolId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.schoolId) {
    redirect("/login");
  }
  return user.schoolId;
}

/** يسجّل إتمام خطوة، ويدفع مؤشر "أبعد خطوة تم بلوغها" للمدرسة. */
async function markStepComplete(schoolId: string, step: number) {
  await prisma.wizardStepProgress.upsert({
    where: { schoolId_step: { schoolId, step } },
    update: {},
    create: { schoolId, step },
  });

  const school = await prisma.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { currentStep: true },
  });
  const next = Math.min(step + 1, TOTAL_WIZARD_STEPS);
  if (next > school.currentStep) {
    await prisma.school.update({
      where: { id: schoolId },
      data: { currentStep: next },
    });
  }
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const optionalInt = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .refine((value) => value === null || (Number.isInteger(value) && value >= 0), {
    message: "أدخل رقمًا صحيحًا موجبًا",
  });

/**
 * حقل اختياري بقيم محدودة (select/radio). لا نعتمد على `.optional()` وحدها:
 * عندما يبقى العنصر المعطَّل (placeholder) هو المحدَّد في select، لا يُرسِل
 * بعض المتصفحات (Chromium) اسم الحقل ضمن FormData إطلاقًا، فتصل القيمة إلى
 * الخادم كـ null — وهي قيمة يرفضها `.optional()` (يقبل undefined فقط) ولا
 * تطابق `z.literal("")`. المعالجة المسبقة هنا توحّد null/""/undefined إلى
 * undefined قبل التحقق.
 */
function optionalEnum(values: [string, ...string[]]) {
  return z
    .preprocess(
      (v) => (typeof v === "string" && v.length > 0 ? v : undefined),
      z.enum(values).optional()
    )
    .transform((v) => v ?? null);
}

const step1Schema = z.object({
  ministryNumber: optionalText(50),
  studyTime: optionalEnum(STUDY_TIME_OPTIONS.map((o) => o.value) as [string, ...string[]]),
  studentsCount: optionalInt,
  classroomsCount: optionalInt,
  buildingType: optionalEnum(BUILDING_TYPE_OPTIONS.map((o) => o.value) as [string, ...string[]]),
  educationType: optionalText(100),
  buildingIndependence: optionalEnum(
    BUILDING_INDEPENDENCE_OPTIONS.map((o) => o.value) as [string, ...string[]]
  ),
  phone: optionalText(30),
  schoolEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.email().safeParse(v).success, {
      message: "بريد إلكتروني غير صحيح",
    }),
  address: optionalText(300),
});

export async function saveStep1Action(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();

  const parsed = step1Schema.safeParse({
    ministryNumber: formData.get("ministryNumber"),
    studyTime: formData.get("studyTime"),
    studentsCount: formData.get("studentsCount"),
    classroomsCount: formData.get("classroomsCount"),
    buildingType: formData.get("buildingType"),
    educationType: formData.get("educationType"),
    buildingIndependence: formData.get("buildingIndependence"),
    phone: formData.get("phone"),
    schoolEmail: formData.get("schoolEmail"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.school.update({ where: { id: schoolId }, data: parsed.data });
  await markStepComplete(schoolId, 1);
  redirect("/wizard/2");
}

const levelEnum = optionalEnum(
  PERFORMANCE_LEVEL_OPTIONS.map((o) => o.value) as [string, ...string[]]
);

const step2Schema = z.object({
  performanceGeneral: levelEnum,
  performanceManagement: levelEnum,
  performanceTeachingLearning: levelEnum,
  performanceLearningOutcomes: levelEnum,
  performanceEnvironment: levelEnum,
});

export async function saveStep2Action(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();

  const parsed = step2Schema.safeParse({
    performanceGeneral: formData.get("performanceGeneral"),
    performanceManagement: formData.get("performanceManagement"),
    performanceTeachingLearning: formData.get("performanceTeachingLearning"),
    performanceLearningOutcomes: formData.get("performanceLearningOutcomes"),
    performanceEnvironment: formData.get("performanceEnvironment"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.school.update({ where: { id: schoolId }, data: parsed.data });
  await markStepComplete(schoolId, 2);
  redirect("/wizard/3");
}

export async function saveStep3Action(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();

  await prisma.$transaction(
    PROCEDURE_INPUTS.map((input) =>
      prisma.procedureInput.upsert({
        where: { schoolId_type: { schoolId, type: input.type } },
        update: {
          acknowledged: formData.get(`ack_${input.type}`) === "on",
          note: (formData.get(`note_${input.type}`) as string | null) || null,
        },
        create: {
          schoolId,
          type: input.type,
          acknowledged: formData.get(`ack_${input.type}`) === "on",
          note: (formData.get(`note_${input.type}`) as string | null) || null,
        },
      })
    )
  );

  await markStepComplete(schoolId, 3);
  redirect("/wizard/4");
}

export async function confirmStep4Action(): Promise<void> {
  const schoolId = await requireSchoolId();
  await markStepComplete(schoolId, 4);
  redirect("/wizard/5");
}

export async function completeStep5Action(): Promise<void> {
  const schoolId = await requireSchoolId();
  await markStepComplete(schoolId, 5);
  redirect("/wizard/6");
}

export async function saveStep6Action(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const strategicGoals = await prisma.strategicGoal.findMany({
    orderBy: { order: "asc" },
  });

  await prisma.$transaction(
    strategicGoals.map((goal) => {
      const text = ((formData.get(`goal_${goal.id}`) as string) ?? "").trim();
      return prisma.operationalGoal.upsert({
        where: { schoolId_strategicGoalId: { schoolId, strategicGoalId: goal.id } },
        update: { text },
        create: { schoolId, strategicGoalId: goal.id, text },
      });
    })
  );

  await markStepComplete(schoolId, 6);
  redirect("/wizard/7");
}

export async function saveStep7Action(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const operationalGoals = await prisma.operationalGoal.findMany({
    where: { schoolId },
  });

  await prisma.$transaction(
    operationalGoals.map((goal) => {
      const indicator = ((formData.get(`kpi_${goal.id}`) as string) ?? "").trim();
      return prisma.kPI.upsert({
        where: { operationalGoalId: goal.id },
        update: { indicator },
        create: { operationalGoalId: goal.id, indicator },
      });
    })
  );

  await markStepComplete(schoolId, 7);
  redirect("/wizard/8");
}

export async function saveStep8Action(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const operationalGoals = await prisma.operationalGoal.findMany({
    where: { schoolId },
  });

  await prisma.$transaction(
    operationalGoals.map((goal) => {
      const targetValue = ((formData.get(`target_${goal.id}`) as string) ?? "").trim();
      return prisma.kPI.upsert({
        where: { operationalGoalId: goal.id },
        update: { targetValue },
        create: { operationalGoalId: goal.id, targetValue },
      });
    })
  );

  await markStepComplete(schoolId, 8);
  redirect("/wizard/9");
}

const SWOT_NEXT_STEP: Record<string, string> = {
  STRENGTH: "/wizard/10",
  WEAKNESS: "/wizard/11",
  OPPORTUNITY: "/wizard/12",
  THREAT: "/wizard/13",
};

export async function saveSwotItemsAction(
  category: string,
  step: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const items = formData
    .getAll("items")
    .map((v) => (v as string).trim())
    .filter(Boolean);

  await prisma.$transaction([
    prisma.swotItem.deleteMany({ where: { schoolId, category } }),
    prisma.swotItem.createMany({
      data: items.map((text, index) => ({
        schoolId,
        category,
        text,
        order: index,
      })),
    }),
  ]);

  await markStepComplete(schoolId, step);
  redirect(SWOT_NEXT_STEP[category] ?? "/dashboard");
}

export async function saveKeyIssuesAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const items = formData
    .getAll("items")
    .map((v) => (v as string).trim())
    .filter(Boolean);

  await prisma.$transaction([
    prisma.keyIssue.deleteMany({ where: { schoolId } }),
    prisma.keyIssue.createMany({
      data: items.map((text, index) => ({ schoolId, text, order: index })),
    }),
  ]);

  await markStepComplete(schoolId, 13);
  redirect("/wizard/14");
}

export async function saveInitiativesAction(
  type: string,
  step: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  const operationalGoals = await prisma.operationalGoal.findMany({
    where: { schoolId },
  });

  await prisma.$transaction(
    operationalGoals.flatMap((goal) => {
      const items = formData
        .getAll(`items_${goal.id}`)
        .map((v) => (v as string).trim())
        .filter(Boolean);

      return [
        prisma.initiativeProgram.deleteMany({
          where: { operationalGoalId: goal.id, type },
        }),
        prisma.initiativeProgram.createMany({
          data: items.map((name, index) => ({
            operationalGoalId: goal.id,
            type,
            name,
            order: index,
          })),
        }),
      ];
    })
  );

  await markStepComplete(schoolId, step);
  redirect(step === 14 ? "/wizard/15" : "/wizard/16");
}

const MAX_EVIDENCE_IMAGE_BYTES = 2 * 1024 * 1024; // 2 ميجابايت
const ALLOWED_EVIDENCE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type EvidenceImagePatch = {
  evidenceImageData?: Uint8Array<ArrayBuffer> | null;
  evidenceImageType?: string | null;
};

/**
 * يقرأ صورة الشاهد المرفوعة لمبادرة/برنامج واحد من FormData، إن وُجدت.
 * يُعيد null إن لم تُرفع صورة جديدة (سواء بقيت السابقة أو طُلب حذفها —
 * تلك الحالة تُعالَج بمفتاح removeEvidenceImage_ منفصل)، أو رسالة خطأ
 * عربية إن كانت الصورة غير صالحة (نوع أو حجم).
 *
 * حقل Prisma من نوع Bytes يتوقّع Uint8Array<ArrayBuffer> تحديدًا، بينما
 * `new Uint8Array(...)` يُستدَل عليه بنوع Uint8Array<ArrayBufferLike>
 * الأعم (يشمل SharedArrayBuffer نظريًا). File.arrayBuffer() في الواقع
 * يُعيد ArrayBuffer حقيقيًا دائمًا (Web API)، فالتحويل هنا آمن.
 */
async function readEvidenceImage(
  formData: FormData,
  id: string
): Promise<{ data: Uint8Array<ArrayBuffer>; type: string } | null | string> {
  const file = formData.get(`evidenceImage_${id}`);
  if (!(file instanceof File) || file.size === 0) return null;

  if (!ALLOWED_EVIDENCE_IMAGE_TYPES.has(file.type)) {
    return "صيغة صورة الشاهد غير مدعومة — يُسمح فقط بـ JPG أو PNG أو WEBP.";
  }
  if (file.size > MAX_EVIDENCE_IMAGE_BYTES) {
    return "حجم صورة الشاهد كبير جدًا — الحد الأقصى 2 ميجابايت.";
  }

  const buffer = await file.arrayBuffer();
  return { data: new Uint8Array(buffer) as Uint8Array<ArrayBuffer>, type: file.type };
}

export async function saveDetailStepAction(
  step: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();

  const initiativeIds = Array.from(
    new Set(
      Array.from(formData.keys())
        .filter((key) => key.startsWith("activity_"))
        .map((key) => key.replace("activity_", ""))
    )
  );

  // تحقّق أن كل مبادرة/برنامج مُدخل فعلًا يتبع مدرسة المستخدم الحالي
  const owned = await prisma.initiativeProgram.findMany({
    where: { id: { in: initiativeIds }, operationalGoal: { schoolId } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((o) => o.id));
  const targetIds = initiativeIds.filter((id) => ownedIds.has(id));

  // اقرأ كل صور الشواهد المرفوعة أولًا (عملية غير متزامنة) قبل بناء
  // المعاملة، وتحقّق من صلاحيتها جميعًا قبل حفظ أي شيء.
  const imagePatches = new Map<string, EvidenceImagePatch>();
  for (const id of targetIds) {
    const result = await readEvidenceImage(formData, id);
    if (typeof result === "string") {
      return { error: result };
    }
    if (result) {
      imagePatches.set(id, {
        evidenceImageData: result.data,
        evidenceImageType: result.type,
      });
    } else if (formData.get(`removeEvidenceImage_${id}`) === "on") {
      imagePatches.set(id, { evidenceImageData: null, evidenceImageType: null });
    }
  }

  await prisma.$transaction(
    targetIds.map((id) => {
      const fields = {
        activity: ((formData.get(`activity_${id}`) as string) ?? "").trim(),
        targetCategory: (
          (formData.get(`category_${id}`) as string) ?? ""
        ).trim(),
        executionRequirements: (
          (formData.get(`requirements_${id}`) as string) ?? ""
        ).trim(),
        executionDate: ((formData.get(`date_${id}`) as string) ?? "").trim(),
        responsible: (
          (formData.get(`responsible_${id}`) as string) ?? ""
        ).trim(),
        evidence: ((formData.get(`evidence_${id}`) as string) ?? "").trim(),
      };
      const imagePatch = imagePatches.get(id) ?? {};

      return prisma.actionItem.upsert({
        where: { initiativeId_order: { initiativeId: id, order: 0 } },
        update: { ...fields, ...imagePatch },
        create: { initiativeId: id, order: 0, ...fields, ...imagePatch },
      });
    })
  );

  await markStepComplete(schoolId, step);
  const nextStep = Math.min(step + 1, TOTAL_WIZARD_STEPS);
  redirect(step === TOTAL_WIZARD_STEPS ? "/dashboard" : `/wizard/${nextStep}`);
}
