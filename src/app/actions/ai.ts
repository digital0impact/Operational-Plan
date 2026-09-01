"use server";

import { requireSchoolId } from "@/lib/auth-guards";
import {
  PAYWALL_MESSAGE,
  getPlanTypeIdByKey,
  schoolCanAccessPlanType,
} from "@/lib/subscription";
import { loadPlanShell } from "@/lib/plan-data";
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
 * كل دالة تتحقق من الجلسة وملكية المدرسة، ثم من أن اشتراك المدرسة يشمل
 * الخطة المعنية تحديدًا (شامل، أو مقتصر على نفس نوع الخطة) — اقتراحات
 * الذكاء الاصطناعي ميزة مدفوعة فقط — قبل تمرير الطلب إلى Claude.
 */

const PAYWALL_RESULT = { ok: false as const, error: PAYWALL_MESSAGE, code: "PAYWALL" as const };

/** كل أفعال المعالج (operational) تتحقّق من نفس نوع الخطة الثابت. */
async function canUseOperationalAi(schoolId: string): Promise<boolean> {
  const planTypeId = await getPlanTypeIdByKey("operational");
  if (!planTypeId) return false;
  return schoolCanAccessPlanType(schoolId, planTypeId);
}

export async function suggestOperationalGoalAction(
  strategicGoalId: string
): Promise<AiResult<{ operationalGoal: string }>> {
  const schoolId = await requireSchoolId();
  if (!(await canUseOperationalAi(schoolId))) return PAYWALL_RESULT;
  return suggestOperationalGoal(schoolId, strategicGoalId);
}

export async function suggestKpiAction(
  operationalGoalId: string
): Promise<AiResult<{ indicator: string; targetValue: string }>> {
  const schoolId = await requireSchoolId();
  if (!(await canUseOperationalAi(schoolId))) return PAYWALL_RESULT;
  return suggestKpi(schoolId, operationalGoalId);
}

export async function suggestSwotItemsAction(
  category: "STRENGTH" | "WEAKNESS" | "OPPORTUNITY" | "THREAT"
): Promise<AiResult<{ items: string[] }>> {
  const schoolId = await requireSchoolId();
  if (!(await canUseOperationalAi(schoolId))) return PAYWALL_RESULT;
  return suggestSwotItems(schoolId, category);
}

export async function suggestKeyIssuesAction(): Promise<AiResult<{ items: string[] }>> {
  const schoolId = await requireSchoolId();
  if (!(await canUseOperationalAi(schoolId))) return PAYWALL_RESULT;
  return suggestKeyIssues(schoolId);
}

export async function suggestActionItemAction(
  initiativeId: string
): Promise<AiResult<ActionItemSuggestion>> {
  const schoolId = await requireSchoolId();
  if (!(await canUseOperationalAi(schoolId))) return PAYWALL_RESULT;
  return suggestActionItem(schoolId, initiativeId);
}

/** لأي قسم OBJECTIVES_LIST على المعمار العام (أهداف، اهتمامات، جوانب
 * تحسين…) — عارض واحد يخدم كل أنواع الخطط، فاقتراح واحد يكفي بدل واحد
 * لكل نوع. يتحقّق من نوع الخطة الفعلي لهذه الخطة تحديدًا (لا "أي خطة
 * مدفوعة")، حتى تعمل بوابة اشتراك الخطة الواحدة بدقة. */
export async function suggestObjectivesListItemsAction(
  planId: string,
  sectionKey: string
): Promise<AiResult<{ items: string[] }>> {
  const schoolId = await requireSchoolId();
  const shell = await loadPlanShell(schoolId, planId);
  if (!shell || !(await schoolCanAccessPlanType(schoolId, shell.planType.id))) {
    return PAYWALL_RESULT;
  }
  return suggestObjectivesListItems(schoolId, planId, sectionKey);
}
