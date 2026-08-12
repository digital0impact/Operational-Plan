"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import type { AiResult } from "@/lib/ai/generate";
import {
  suggestActionItem,
  suggestKeyIssues,
  suggestKpi,
  suggestOperationalGoal,
  suggestSwotItems,
  type ActionItemSuggestion,
} from "@/lib/ai/prompts";

/**
 * Server Actions تُستدعى مباشرة من مكوّنات "اقترح بالذكاء الاصطناعي" في
 * المعالج (زر يستدعي الدالة ثم يملأ الحقل بالنتيجة، بلا إرسال نموذج).
 * كل دالة تتحقق من الجلسة وملكية المدرسة قبل تمرير الطلب إلى Claude.
 */

async function requireSchoolId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.schoolId) {
    redirect("/login");
  }
  return user.schoolId;
}

export async function suggestOperationalGoalAction(
  strategicGoalId: string
): Promise<AiResult<{ operationalGoal: string }>> {
  const schoolId = await requireSchoolId();
  return suggestOperationalGoal(schoolId, strategicGoalId);
}

export async function suggestKpiAction(
  operationalGoalId: string
): Promise<AiResult<{ indicator: string; targetValue: string }>> {
  const schoolId = await requireSchoolId();
  return suggestKpi(schoolId, operationalGoalId);
}

export async function suggestSwotItemsAction(
  category: "STRENGTH" | "WEAKNESS" | "OPPORTUNITY" | "THREAT"
): Promise<AiResult<{ items: string[] }>> {
  const schoolId = await requireSchoolId();
  return suggestSwotItems(schoolId, category);
}

export async function suggestKeyIssuesAction(): Promise<AiResult<{ items: string[] }>> {
  const schoolId = await requireSchoolId();
  return suggestKeyIssues(schoolId);
}

export async function suggestActionItemAction(
  initiativeId: string
): Promise<AiResult<ActionItemSuggestion>> {
  const schoolId = await requireSchoolId();
  return suggestActionItem(schoolId, initiativeId);
}
