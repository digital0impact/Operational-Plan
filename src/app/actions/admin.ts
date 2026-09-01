"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { generateActivationCode } from "@/lib/tokens";
import type { ActionState } from "@/app/actions/auth";

const generateCodesSchema = z.object({
  count: z.coerce.number().int().min(1).max(50),
  durationMonths: z.coerce.number().int().refine((v) => v === 6 || v === 12, {
    message: "مدة الاشتراك يجب أن تكون 6 أو 12 شهرًا",
  }),
  issuedFor: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function generateActivationCodesAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = generateCodesSchema.safeParse({
    count: formData.get("count"),
    durationMonths: formData.get("durationMonths"),
    issuedFor: formData.get("issuedFor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const codes = Array.from({ length: parsed.data.count }, () => ({
    code: generateActivationCode(),
    durationMonths: parsed.data.durationMonths,
    issuedFor: parsed.data.issuedFor,
  }));

  // احتمال تصادم رمزين عشوائيين ضئيل جدًا، لكن نُعيد المحاولة دفاعيًا
  for (const entry of codes) {
    let attempts = 0;
    while (attempts < 3) {
      try {
        await prisma.activationCode.create({ data: entry });
        break;
      } catch {
        entry.code = generateActivationCode();
        attempts += 1;
      }
    }
  }

  redirect("/admin/codes");
}

export async function deleteActivationCodeAction(id: string): Promise<void> {
  await requireAdmin();
  await prisma.activationCode.deleteMany({ where: { id, used: false } });
  redirect("/admin/codes");
}
