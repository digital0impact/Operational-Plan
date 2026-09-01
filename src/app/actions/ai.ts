"use server";

import { requireSchoolId } from "@/lib/auth-guards";
import { isSchoolPaid, PAYWALL_MESSAGE } from "@/lib/subscription";
import type { AiResult } from "@/lib/ai/generate";
import {
  suggestActionItem,
  suggestKeyIssues,
  suggestKpi,
  suggestObjectivesListItems,
  suggestOperationalGoal,
  suggestSwotItems,
  type ActionItemSuggestion,
} from "@/lib/ai/prompts";

/**
 * Server Actions تُستدعى مباشرة من مكوّنات "اقترح بالذكاء الاصطناعي" في
 * المعالج (زر يستدعي الدالة ثم يملأ الحقل بالنتيجة، بلا إرسال نموذج).
 * كل دالة تتحقق من الجلسة وملكية المدرسة، ثم من أن المدرسة على خطة مدفوعة
 * (اقتراحات الذكاء الاصطناعي ميزة مدفوعة فقط)، قبل تمرير الطلب إلى Claude.
 */

const PAYWALL_RESULT = { ok: false as const, error: PAYWALL_MESSAGE, code: "PAYWALL" as const };

export async function suggestOperationalGoalAction(
  strategicGoalId: string
): Promise<AiResult<{ operationalGoal: string }>> {
  const schoolId = await requireSchoolId();
  if (!(await isSchoolPaid(schoolId))) return PAYWALL_RESULT;
  return suggestOperationalGoal(schoolId, strategicGoalId);
}

export async function suggestKpiAction(
  operationalGoalId: string
): Promise<AiResult<{ indicator: string; targetValue: string }>> {
  const schoolId = await requireSchoolId();
  if (!(await isSchoolPaid(schoolId))) return PAYWALL_RESULT;
  return suggestKpi(schoolId, operationalGoalId);
}

export async function suggestSwotItemsAction(
  category: "STRENGTH" | "WEAKNESS" | "OPPORTUNITY" | "THREAT"
): Promise<AiResult<{ items: string[] }>> {
  const schoolId = await requireSchoolId();
  if (!(await isSchoolPaid(schoolId))) return PAYWALL_RESULT;
  return suggestSwotItems(schoolId, category);
}

export async function suggestKeyIssuesAction(): Promise<AiResult<{ items: string[] }>> {
  const schoolId = await requireSchoolId();
  if (!(await isSchoolPaid(schoolId))) return PAYWALL_RESULT;
  return suggestKeyIssues(schoolId);
}

export async function suggestActionItemAction(
  initiativeId: string
): Promise<AiResult<ActionItemSuggestion>> {
  const schoolId = await requireSchoolId();
  if (!(await isSchoolPaid(schoolId))) return PAYWALL_RESULT;
  return suggestActionItem(schoolId, initiativeId);
}

/** لأي قسم OBJECTIVES_LIST على المعمار العام (أهداف، اهتمامات، جوانب
 * تحسين…) — عارض واحد يخدم كل أنواع الخطط، فاقتراح واحد يكفي بدل واحد
 * لكل نوع. */
export async function suggestObjectivesListItemsAction(
  planId: string,
  sectionKey: string
): Promise<AiResult<{ items: string[] }>> {
  const schoolId = await requireSchoolId();
  if (!(await isSchoolPaid(schoolId))) return PAYWALL_RESULT;
  return suggestObjectivesListItems(schoolId, planId, sectionKey);
}
