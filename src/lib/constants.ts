// قوائم ثابتة مشتركة بين نموذج التسجيل ومعالج الخطة التشغيلية

export const SCHOOL_GENDER_OPTIONS = [
  { value: "KINDERGARTEN", label: "رياض أطفال" },
  { value: "GIRLS", label: "بنات" },
  { value: "BOYS", label: "بنين" },
] as const;

export const SCHOOL_CLASSIFICATION_OPTIONS = [
  { value: "PRIVATE", label: "أهلي" },
  { value: "GOVERNMENT", label: "حكومي" },
  { value: "INTERNATIONAL", label: "عالمي" },
] as const;

export const SCHOOL_STAGE_OPTIONS = [
  { value: "KINDERGARTEN", label: "رياض الأطفال" },
  { value: "PRIMARY", label: "ابتدائية" },
  { value: "PRIMARY_MIDDLE", label: "ابتدائي ومتوسط" },
  { value: "PRIMARY_WITH_KG", label: "ابتدائية وروضة ملحقة" },
  { value: "PRIMARY_UPPER_MIDDLE", label: "إبتدائية صفوف عليا ومتوسطة" },
  { value: "MIDDLE", label: "متوسطة" },
  { value: "SECONDARY", label: "ثانوية" },
  { value: "COMPLEX_KG_PRIMARY_MIDDLE", label: "مجمع روضة وابتدائي ومتوسط" },
  { value: "COMPLEX_MIDDLE_SECONDARY", label: "مجمع متوسطة وثانوية" },
  { value: "COMPLEX_PRIMARY_MIDDLE_SECONDARY", label: "مجمع ابتدائية ومتوسطة وثانوية" },
  { value: "COMPLEX_KG_PRIMARY_MIDDLE_SECONDARY", label: "مجمع روضة وابتدائي ومتوسط وثانوي" },
] as const;

export const STUDY_TIME_OPTIONS = [
  { value: "MORNING", label: "صباحي" },
  { value: "EVENING", label: "مسائي" },
  { value: "TWO_SHIFTS", label: "فترتين" },
] as const;

export const BUILDING_TYPE_OPTIONS = [
  { value: "GOVERNMENT", label: "حكومي" },
  { value: "RENTED", label: "مستأجر" },
  { value: "ENDOWMENT", label: "وقف" },
] as const;

export const BUILDING_INDEPENDENCE_OPTIONS = [
  { value: "INDEPENDENT", label: "مستقل" },
  { value: "SHARED", label: "مشترك" },
] as const;

export const PERFORMANCE_LEVEL_OPTIONS = [
  { value: "EXCELLENT", label: "ممتاز" },
  { value: "VERY_GOOD", label: "جيد جدًا" },
  { value: "GOOD", label: "جيد" },
  { value: "ACCEPTABLE", label: "مقبول" },
  { value: "NEEDS_IMPROVEMENT", label: "بحاجة إلى تحسين" },
] as const;

export const PROCEDURE_INPUTS = [
  {
    type: "PERFORMANCE_REPORT",
    label: "تقارير الأداء للمدرسة (الدروس المستفادة)",
  },
  {
    type: "MINISTRY_STRATEGY",
    label: "الخطة الاستراتيجية لوزارة التعليم",
  },
  {
    type: "ADMIN_PLAN",
    label: "الخطة التشغيلية لإدارة التعليم العامة",
  },
  {
    type: "CORRECTIVE_ACTIONS",
    label:
      "تقرير توصيات خطة الإجراءات التقويمية (الإجراءات التصحيحية والوقائية والتحسينية)",
  },
] as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  SCHOOL_MANAGER: "مدير المدرسة",
  TEAM_MEMBER: "فريق التميز",
  GENERAL_ADMIN: "الإدارة العامة للتعليم",
};

export const SWOT_CATEGORIES = [
  { value: "STRENGTH", label: "نقاط القوة", step: 9 },
  { value: "WEAKNESS", label: "نقاط الضعف", step: 10 },
  { value: "OPPORTUNITY", label: "الفرص", step: 11 },
  { value: "THREAT", label: "التهديدات", step: 12 },
] as const;

export const REVIEWER_ROLE_LABELS: Record<string, string> = {
  SUPERVISOR: "مشرف تربوي",
  PARENT: "ولي أمر",
  OTHER: "أخرى",
};

export const VISIT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "بانتظار رد المعلم/ة",
  CONFIRMED: "مؤكَّدة",
  RESCHEDULE_REQUESTED: "طُلب إعادة جدولة",
};

export const INITIATIVE_TYPES = {
  INITIATIVE: { value: "INITIATIVE", label: "مبادرة", step: 14 },
  PROGRAM: { value: "PROGRAM", label: "برنامج", step: 15 },
} as const;

/** خارطة معالج الخطة التشغيلية الكاملة (25 خطوة). */
export const WIZARD_STAGES = [
  { key: "setup", label: "الإعداد والبيانات", from: 1, to: 4 },
  { key: "strategic", label: "الارتباط الاستراتيجي", from: 5, to: 6 },
  { key: "kpi", label: "مؤشرات الأداء", from: 7, to: 8 },
  { key: "swot", label: "تحليل SWOT", from: 9, to: 12 },
  { key: "issues", label: "القضايا والمبادرات", from: 13, to: 15 },
  { key: "detail", label: "الخطة التفصيلية", from: 16, to: 25 },
] as const;

export const WIZARD_STEP_TITLES: Record<number, string> = {
  1: "بيانات المدرسة الأساسية",
  2: "مستوى الأداء العام",
  3: "مدخلات الإجراء",
  4: "مراجعة وتأكيد",
  5: "الأهداف الاستراتيجية لوزارة التعليم",
  6: "الأهداف التشغيلية للمدرسة",
  7: "مؤشرات قياس الأداء",
  8: "القيم المستهدفة",
  9: "نقاط القوة",
  10: "نقاط الضعف",
  11: "الفرص",
  12: "التهديدات",
  13: "القضايا الرئيسية",
  14: "المبادرات",
  15: "البرامج",
  16: "الخطة التفصيلية",
  17: "الخطة التفصيلية",
  18: "الخطة التفصيلية",
  19: "الخطة التفصيلية",
  20: "الخطة التفصيلية",
  21: "الخطة التفصيلية",
  22: "الخطة التفصيلية",
  23: "الخطة التفصيلية",
  24: "الخطة التفصيلية",
  25: "الخطة التفصيلية",
};

export const TOTAL_WIZARD_STEPS = 25;
export const IMPLEMENTED_WIZARD_STEPS = 25;

/** رقم الهدف الاستراتيجي (1-10) لخطوة من خطوات الجدول التفصيلي (16-25). */
export function detailStepGoalOrder(step: number): number {
  return step - 15;
}

export function detailStepForGoalOrder(order: number): number {
  return order + 15;
}

export function findLabel(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined
): string {
  return options.find((option) => option.value === value)?.label ?? "—";
}
