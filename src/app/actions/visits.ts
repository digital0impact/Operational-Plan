"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSchoolId } from "@/lib/auth-guards";
import { generatePublicToken } from "@/lib/tokens";
import { schoolHasFullAccess, PAYWALL_MESSAGE } from "@/lib/subscription";
import type { ActionState } from "@/app/actions/auth";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const scheduleVisitSchema = z.object({
  teacherName: z.string().trim().min(2, "اكتب اسم المعلم/ة").max(150),
  subject: optionalText(100),
  className: optionalText(100),
  date: z.string().trim().min(1, "اختر تاريخ الزيارة"),
  time: z.string().trim().min(1, "اختر وقت الزيارة"),
  purpose: optionalText(500),
});

/** مدير المدرسة يُجدول زيارة صفية جديدة، وتُولَّد لها رابط رد عام تلقائيًا. */
export async function scheduleVisitAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schoolId = await requireSchoolId();
  if (!(await schoolHasFullAccess(schoolId))) {
    return { error: PAYWALL_MESSAGE };
  }

  const parsed = scheduleVisitSchema.safeParse({
    teacherName: formData.get("teacherName"),
    subject: formData.get("subject"),
    className: formData.get("className"),
    date: formData.get("date"),
    time: formData.get("time"),
    purpose: formData.get("purpose"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من البيانات المدخلة" };
  }

  const scheduledAt = new Date(`${parsed.data.date}T${parsed.data.time}`);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: "تاريخ أو وقت الزيارة غير صالح" };
  }

  await prisma.classroomVisit.create({
    data: {
      schoolId,
      teacherName: parsed.data.teacherName,
      subject: parsed.data.subject,
      className: parsed.data.className,
      scheduledAt,
      purpose: parsed.data.purpose,
      responseToken: generatePublicToken(),
    },
  });

  redirect("/visits");
}

/** حذف زيارة (المدرسة المالكة فقط) — بأي حالة، للتخلّص من الزيارات المنتهية. */
export async function deleteVisitAction(id: string) {
  const schoolId = await requireSchoolId();
  await prisma.classroomVisit.deleteMany({ where: { id, schoolId } });
  redirect("/visits");
}

const respondVisitSchema = z.object({
  decision: z.enum(["confirm", "reschedule"]),
  note: optionalText(500),
});

/** رد المعلم/ة عبر الرابط العام (بلا تسجيل دخول): تأكيد أو طلب إعادة جدولة. */
export async function respondVisitAction(
  token: string,
  formData: FormData
): Promise<void> {
  const visit = await prisma.classroomVisit.findUnique({
    where: { responseToken: token },
  });

  // لا يوجد رد بعد أن يستجيب المعلم/ة مرة واحدة — الحالة نفسها في قاعدة
  // البيانات هي مصدر الحقيقة، فلا حاجة لكوكي منع تكرار كما في التصويت.
  if (!visit || visit.status !== "SCHEDULED") {
    redirect(`/visit/${token}`);
  }

  const parsed = respondVisitSchema.safeParse({
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    redirect(`/visit/${token}`);
  }

  await prisma.classroomVisit.update({
    where: { responseToken: token },
    data: {
      status: parsed.data.decision === "confirm" ? "CONFIRMED" : "RESCHEDULE_REQUESTED",
      responseNote: parsed.data.note,
      respondedAt: new Date(),
    },
  });

  redirect(`/visit/${token}`);
}
