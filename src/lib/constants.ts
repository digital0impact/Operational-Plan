// قوائم ثابتة مشتركة بين نموذج التسجيل ومعالج الخطة التشغيلية

export const SCHOOL_GENDER_OPTIONS = [
  { value: "KINDERGARTEN", label: "رياض أطفال" },
  { value: "GIRLS", label: "بنات" },
  { value: "BOYS", label: "بنين" },
] as const;

export const SCHOOL_CLASSIFICATION_OPTIONS = [
  { value: "PRIVATE", label: "أهلي" },
  { value: "GOVERNMENT", label: "حكومي" },
  { value: "SPECIALIZED", label: "متخصص" },
  { value: "INTERNATIONAL", label: "عالمي" },
] as const;

export const SCHOOL_STAGE_OPTIONS = [
  { value: "KINDERGARTEN", label: "رياض الأطفال" },
  { value: "PRIMARY", label: "المرحلة الابتدائية" },
  { value: "MIDDLE", label: "المرحلة المتوسطة" },
  { value: "SECONDARY", label: "المرحلة الثانوية" },
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

/** خارطة معالج الخطة التشغيلية الكاملة (25 خطوة) — 1 إلى 4 مُنفَّذة في هذا الإصدار. */
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
};

export const TOTAL_WIZARD_STEPS = 25;
export const IMPLEMENTED_WIZARD_STEPS = 4;

export function findLabel(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined
): string {
  return options.find((option) => option.value === value)?.label ?? "—";
}
