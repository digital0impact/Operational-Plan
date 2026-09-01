import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

// الأهداف الاستراتيجية العشرة لوزارة التعليم — كما وردت حرفيًا في
// "دليل إجراءات عمل مدارس التعليم العام 2025م" (إعداد الخطة التشغيلية، صفحة 3)
const STRATEGIC_GOALS = [
  "ضمان وصول التعليم للجميع",
  "تطوير بيئة مدرسية آمنة وابتكارية",
  "تعزيز القيم والهوية الوطنية",
  "تحسين تجربة المستفيدين",
  "الاستثمار في الطلاب والمدارس الأولى بالرعاية",
  "تحسين أداء المدارس، وتعزيز شراكتها مع المجتمع",
  "رفع كفاءة الإنفاق وتعزيز الاستدامة المالية",
  "تطوير كفاءات الموارد البشرية وتعزيز الثقافة المؤسسية",
  "الارتقاء بمستوى التجربة الرقمية",
  "تعزيز الحوكمة والالتزام وإدارة المخاطر",
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  for (const [index, title] of STRATEGIC_GOALS.entries()) {
    await prisma.strategicGoal.upsert({
      where: { order: index + 1 },
      update: { title },
      create: { order: index + 1, title },
    });
  }
  console.log(`تمت زراعة ${STRATEGIC_GOALS.length} أهداف استراتيجية.`);

  // رمز اشتراك تجريبي لاختبار ترقية الاشتراك محليًا (يُدخَل من صفحة
  // /subscription بعد تسجيل الدخول، لا عند التسجيل — التسجيل حر بلا رمز)
  const demoCode = "SCH-DEMO-0001";
  await prisma.activationCode.upsert({
    where: { code: demoCode },
    update: {},
    create: {
      code: demoCode,
      durationMonths: 12,
      issuedFor: "رمز اشتراك تجريبي — للاختبار المحلي",
    },
  });
  console.log(`رمز الاشتراك التجريبي: ${demoCode}`);

  // حساب إدارة عامة تجريبي — لإصدار رموز التفعيل ومتابعة المدارس
  const adminEmail = "admin@moe.test";
  const adminPassword = "Admin@12345";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "الإدارة العامة للتعليم",
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        role: "GENERAL_ADMIN",
      },
    });
  }
  console.log(`حساب الإدارة العامة التجريبي: ${adminEmail} / ${adminPassword}`);

  // أساس منصة الخطط المتعددة (مرحلة أ من خطة المعمار): نوع خطة "تشغيلية"
  // + قالبها + أقسامه — بيانات فقط، لا يقرأها معالج /wizard الحالي بعد.
  const operationalType = await prisma.planType.upsert({
    where: { key: "operational" },
    update: { nameAr: "الخطة التشغيلية", nameEn: "School Operational Plan" },
    create: {
      key: "operational",
      nameAr: "الخطة التشغيلية",
      nameEn: "School Operational Plan",
      isCustom: false,
    },
  });

  const operationalTemplate = await prisma.planTemplate.upsert({
    where: { planTypeId_version: { planTypeId: operationalType.id, version: 1 } },
    update: { isActive: true },
    create: { planTypeId: operationalType.id, version: 1, isActive: true },
  });

  // تجميع الأقسام يعكس WIZARD_STAGES في src/lib/constants.ts حرفيًا —
  // legacyWizardSteps في configJson للتوثيق فقط (مرجع لخطوات المعالج
  // الحالي المقابلة)، وليس حقلًا يقرأه أي كود اليوم.
  const OPERATIONAL_SECTIONS = [
    {
      key: "setup",
      order: 1,
      titleAr: "الإعداد والبيانات",
      titleEn: "Setup & Basic Data",
      kind: "STATIC_INFO",
      configJson: { legacyWizardSteps: [1, 4] },
    },
    {
      key: "strategic_alignment",
      order: 2,
      titleAr: "الارتباط الاستراتيجي",
      titleEn: "Strategic Alignment",
      kind: "OBJECTIVES_LIST",
      configJson: { legacyWizardSteps: [5, 6] },
    },
    {
      key: "kpi",
      order: 3,
      titleAr: "مؤشرات الأداء",
      titleEn: "Performance Indicators",
      kind: "INDICATORS_LIST",
      configJson: { legacyWizardSteps: [7, 8] },
    },
    {
      key: "swot",
      order: 4,
      titleAr: "تحليل SWOT",
      titleEn: "SWOT Analysis",
      kind: "SWOT_GRID",
      configJson: { legacyWizardSteps: [9, 12] },
    },
    {
      key: "issues_initiatives",
      order: 5,
      titleAr: "القضايا والمبادرات والبرامج",
      titleEn: "Issues, Initiatives & Programs",
      kind: "PROGRAMS_LIST",
      configJson: { legacyWizardSteps: [13, 15] },
    },
    {
      key: "detail_plan",
      order: 6,
      titleAr: "الخطة التفصيلية",
      titleEn: "Detailed Execution Plan",
      kind: "DETAIL_TABLE",
      configJson: { legacyWizardSteps: [16, 25], repeatPerObjective: true },
    },
  ] as const;

  type SectionSeed = {
    key: string;
    order: number;
    titleAr: string;
    titleEn: string;
    kind: string;
    configJson: Prisma.InputJsonValue;
  };

  async function seedSections(templateId: string, sections: readonly SectionSeed[]) {
    for (const section of sections) {
      await prisma.planTemplateSection.upsert({
        where: { templateId_key: { templateId, key: section.key } },
        update: {
          order: section.order,
          titleAr: section.titleAr,
          titleEn: section.titleEn,
          kind: section.kind,
          configJson: section.configJson,
        },
        create: { templateId, ...section },
      });
    }
  }

  await seedSections(operationalTemplate.id, OPERATIONAL_SECTIONS);
  console.log(
    `تمت زراعة نوع الخطة "operational" وقالبه (${OPERATIONAL_SECTIONS.length} أقسام).`
  );

  // خطة النشاط الطلابي — أول نوع خطة يعمل فعليًا على معمار الخطط العام
  // (Plan/PlanObjective/PlanProgram/PlanActivity/PlanIndicator، مرحلة ب)،
  // إثباتًا لصحة المعمار قبل تعميمه على بقية أنواع الخطط.
  const studentActivityType = await prisma.planType.upsert({
    where: { key: "student_activity" },
    update: { nameAr: "خطة النشاط الطلابي", nameEn: "Student Activities Plan" },
    create: {
      key: "student_activity",
      nameAr: "خطة النشاط الطلابي",
      nameEn: "Student Activities Plan",
      isCustom: false,
    },
  });

  const studentActivityTemplate = await prisma.planTemplate.upsert({
    where: { planTypeId_version: { planTypeId: studentActivityType.id, version: 1 } },
    update: { isActive: true },
    create: { planTypeId: studentActivityType.id, version: 1, isActive: true },
  });

  // كل قسم لاحق يشير بـ objectivesSectionKey/programsSectionKey إلى القسم
  // الذي يبني عليه — بالضبط نفس تسلسل الخطة التشغيلية (هدف ← مؤشر
  // ومبادرات ← تفاصيل تنفيذ) لكن مُعرَّفًا كبيانات لا كخطوات مرقّمة بالكود.
  const STUDENT_ACTIVITY_SECTIONS: readonly SectionSeed[] = [
    {
      key: "general_info",
      order: 1,
      titleAr: "معلومات عامة",
      titleEn: "General Information",
      kind: "STATIC_INFO",
      configJson: {
        description:
          "هذا القسم تعريفي بخطة النشاط الطلابي. راجع الأقسام التالية لتسجيل أهداف الخطة، ثم مؤشرات قياسها، ثم الأنشطة والبرامج، ثم تفاصيل تنفيذها.",
      },
    },
    {
      key: "goals",
      order: 2,
      titleAr: "الأهداف",
      titleEn: "Goals",
      kind: "OBJECTIVES_LIST",
      configJson: { itemLabel: "هدف", placeholder: "اكتب هدفًا لخطة النشاط الطلابي…" },
    },
    {
      key: "indicators",
      order: 3,
      titleAr: "المؤشرات",
      titleEn: "Indicators",
      kind: "INDICATORS_LIST",
      configJson: { objectivesSectionKey: "goals" },
    },
    {
      key: "programs",
      order: 4,
      titleAr: "الأنشطة والبرامج",
      titleEn: "Activities & Programs",
      kind: "PROGRAMS_LIST",
      configJson: { objectivesSectionKey: "goals", itemLabel: "نشاط/برنامج" },
    },
    {
      key: "detail_plan",
      order: 5,
      titleAr: "الخطة التفصيلية",
      titleEn: "Detailed Execution Plan",
      kind: "DETAIL_TABLE",
      configJson: { programsSectionKey: "programs" },
    },
    {
      key: "weekly_schedule",
      order: 6,
      titleAr: "الجدول الأسبوعي للأنشطة",
      titleEn: "Weekly Activity Schedule",
      kind: "WEEKLY_ACTIVITY_GRID",
      configJson: { weeksCount: 18 },
    },
    {
      key: "program_weeks",
      order: 7,
      titleAr: "ربط البرامج بأسابيع الخطة الفصلية",
      titleEn: "Link Programs to Quarterly Plan Weeks",
      kind: "PROGRAM_WEEK_TAGS",
      configJson: { programsSectionKey: "programs", weeksCount: 14 },
    },
  ] as const;

  await seedSections(studentActivityTemplate.id, STUDENT_ACTIVITY_SECTIONS);
  console.log(
    `تمت زراعة نوع الخطة "student_activity" وقالبه (${STUDENT_ACTIVITY_SECTIONS.length} أقسام).`
  );

  // رعاية الموهوبين — دليل إجراءات عمل مدارس التعليم العام (الإصدار
  // الرابع) يحصر متطلباتها في: حصر وتصنيف اهتمامات الموهوبين، توزيعهم وفق
  // الاهتمامات، إعداد جدول زمني مناسب لكل برنامج، ثم المراجعة والاعتماد —
  // لا يذكر الدليل مؤشرات أداء لها، فلا يوجد قسم INDICATORS_LIST هنا عمدًا.
  const giftedCareType = await prisma.planType.upsert({
    where: { key: "gifted_care" },
    update: { nameAr: "خطة رعاية الموهوبين", nameEn: "Gifted Students Care Plan" },
    create: {
      key: "gifted_care",
      nameAr: "خطة رعاية الموهوبين",
      nameEn: "Gifted Students Care Plan",
      isCustom: false,
    },
  });

  const giftedCareTemplate = await prisma.planTemplate.upsert({
    where: { planTypeId_version: { planTypeId: giftedCareType.id, version: 1 } },
    update: { isActive: true },
    create: { planTypeId: giftedCareType.id, version: 1, isActive: true },
  });

  const GIFTED_CARE_SECTIONS: readonly SectionSeed[] = [
    {
      key: "general_info",
      order: 1,
      titleAr: "معلومات عامة",
      titleEn: "General Information",
      kind: "STATIC_INFO",
      configJson: {
        description:
          "هذا القسم تعريفي بخطة رعاية الموهوبين. راعِ عند التوزيع على البرامج: (١) عدم تعارض البرامج فيما بينها إذا كان للطالب أكثر من اهتمام، و(٢) عدم التأثير سلبًا على التحصيل الدراسي بسبب زيادة العبء على الطالب الموهوب.",
      },
    },
    {
      key: "interests",
      order: 2,
      titleAr: "اهتمامات الموهوبين",
      titleEn: "Gifted Students' Interests",
      kind: "OBJECTIVES_LIST",
      configJson: { itemLabel: "مجال اهتمام", placeholder: "مثال: الروبوتات، الرياضيات، الفنون…" },
    },
    {
      key: "programs",
      order: 3,
      titleAr: "البرامج الإثرائية",
      titleEn: "Enrichment Programs",
      kind: "PROGRAMS_LIST",
      configJson: { objectivesSectionKey: "interests", itemLabel: "برنامج إثرائي" },
    },
    {
      key: "detail_plan",
      order: 4,
      titleAr: "الجدول الزمني والتنفيذ",
      titleEn: "Schedule & Execution",
      kind: "DETAIL_TABLE",
      configJson: { programsSectionKey: "programs" },
    },
  ] as const;

  await seedSections(giftedCareTemplate.id, GIFTED_CARE_SECTIONS);
  console.log(
    `تمت زراعة نوع الخطة "gifted_care" وقالبه (${GIFTED_CARE_SECTIONS.length} أقسام).`
  );

  // خطة برامج التوجيه الطلابي — بنطاقها التنفيذي فقط (البرامج والأنشطة،
  // زمن التنفيذ، آلية التنفيذ، المنفذون) دون حصر حالات الطلاب الفردية
  // (الصحية/النفسية/الاجتماعية/التربوية)، بقرار صريح لإبقاء هذا النوع على
  // نفس معمار "هدف ← برنامج ← تفاصيل تنفيذ" دون حاجة لنوع قسم جديد.
  const studentGuidanceType = await prisma.planType.upsert({
    where: { key: "student_guidance" },
    update: {
      nameAr: "خطة برامج التوجيه الطلابي",
      nameEn: "Student Guidance Programs Plan",
    },
    create: {
      key: "student_guidance",
      nameAr: "خطة برامج التوجيه الطلابي",
      nameEn: "Student Guidance Programs Plan",
      isCustom: false,
    },
  });

  const studentGuidanceTemplate = await prisma.planTemplate.upsert({
    where: { planTypeId_version: { planTypeId: studentGuidanceType.id, version: 1 } },
    update: { isActive: true },
    create: { planTypeId: studentGuidanceType.id, version: 1, isActive: true },
  });

  const STUDENT_GUIDANCE_SECTIONS: readonly SectionSeed[] = [
    {
      key: "general_info",
      order: 1,
      titleAr: "معلومات عامة",
      titleEn: "General Information",
      kind: "STATIC_INFO",
      configJson: {
        description:
          "هذا القسم يغطي البرامج والأنشطة الإرشادية التنفيذية فقط — لا يشمل حصر حالات الطلاب الفردية (الصحية أو النفسية أو الاجتماعية أو التربوية)، فتلك تُدار بأدوات التوجيه الطلابي الخاصة بها.",
      },
    },
    {
      key: "goals",
      order: 2,
      titleAr: "الأهداف الإرشادية",
      titleEn: "Guidance Goals",
      kind: "OBJECTIVES_LIST",
      configJson: {
        itemLabel: "هدف إرشادي",
        placeholder: "مثال: تعزيز الصحة النفسية للطلاب، الوقاية من التنمر…",
      },
    },
    {
      key: "programs",
      order: 3,
      titleAr: "البرامج والأنشطة",
      titleEn: "Programs & Activities",
      kind: "PROGRAMS_LIST",
      configJson: { objectivesSectionKey: "goals", itemLabel: "برنامج/نشاط إرشادي" },
    },
    {
      key: "detail_plan",
      order: 4,
      titleAr: "تفاصيل التنفيذ",
      titleEn: "Execution Details",
      kind: "DETAIL_TABLE",
      configJson: { programsSectionKey: "programs" },
    },
    {
      key: "program_weeks",
      order: 5,
      titleAr: "ربط البرامج بأسابيع الخطة الفصلية",
      titleEn: "Link Programs to Quarterly Plan Weeks",
      kind: "PROGRAM_WEEK_TAGS",
      configJson: { programsSectionKey: "programs", weeksCount: 14 },
    },
  ] as const;

  await seedSections(studentGuidanceTemplate.id, STUDENT_GUIDANCE_SECTIONS);
  console.log(
    `تمت زراعة نوع الخطة "student_guidance" وقالبه (${STUDENT_GUIDANCE_SECTIONS.length} أقسام).`
  );

  // خطة الإرشاد الصحي — بنفس معمار "هدف ← برنامج ← تفاصيل تنفيذ" الذي أثبت
  // نفسه في خطة التوجيه الطلابي (لا يوجد فصل رسمي منفرد لها في الدليل
  // بمعزل عن التوجيه الطلابي، فبُنيت على نفس الشكل التنفيذي: فعاليات
  // ومبادرات صحية مدرسية — فحص استكشافي، تهيئة العيادة، سلامة غذائية،
  // متابعة الفريق الصحي… — لا حصر حالات صحية فردية).
  const healthGuidanceType = await prisma.planType.upsert({
    where: { key: "health_guidance" },
    update: { nameAr: "خطة الإرشاد الصحي", nameEn: "Health Guidance Plan" },
    create: {
      key: "health_guidance",
      nameAr: "خطة الإرشاد الصحي",
      nameEn: "Health Guidance Plan",
      isCustom: false,
    },
  });

  const healthGuidanceTemplate = await prisma.planTemplate.upsert({
    where: { planTypeId_version: { planTypeId: healthGuidanceType.id, version: 1 } },
    update: { isActive: true },
    create: { planTypeId: healthGuidanceType.id, version: 1, isActive: true },
  });

  const HEALTH_GUIDANCE_SECTIONS: readonly SectionSeed[] = [
    {
      key: "general_info",
      order: 1,
      titleAr: "معلومات عامة",
      titleEn: "General Information",
      kind: "STATIC_INFO",
      configJson: {
        description:
          "هذا القسم يغطي الفعاليات والبرامج الصحية المدرسية التنفيذية (فحص استكشافي، تهيئة العيادة، سلامة غذائية، متابعة الفريق الصحي…) — لا يشمل حصر حالات صحية فردية للطلاب.",
      },
    },
    {
      key: "goals",
      order: 2,
      titleAr: "الأهداف الصحية",
      titleEn: "Health Goals",
      kind: "OBJECTIVES_LIST",
      configJson: {
        itemLabel: "هدف صحي",
        placeholder: "مثال: الوقاية من الأمراض المعدية، تعزيز السلامة الغذائية…",
      },
    },
    {
      key: "programs",
      order: 3,
      titleAr: "البرامج والفعاليات الصحية",
      titleEn: "Health Programs & Events",
      kind: "PROGRAMS_LIST",
      configJson: { objectivesSectionKey: "goals", itemLabel: "برنامج/فعالية صحية" },
    },
    {
      key: "detail_plan",
      order: 4,
      titleAr: "تفاصيل التنفيذ",
      titleEn: "Execution Details",
      kind: "DETAIL_TABLE",
      configJson: { programsSectionKey: "programs" },
    },
    {
      key: "program_weeks",
      order: 5,
      titleAr: "ربط البرامج بأسابيع الخطة الفصلية",
      titleEn: "Link Programs to Quarterly Plan Weeks",
      kind: "PROGRAM_WEEK_TAGS",
      configJson: { programsSectionKey: "programs", weeksCount: 14 },
    },
  ] as const;

  await seedSections(healthGuidanceTemplate.id, HEALTH_GUIDANCE_SECTIONS);
  console.log(
    `تمت زراعة نوع الخطة "health_guidance" وقالبه (${HEALTH_GUIDANCE_SECTIONS.length} أقسام).`
  );

  // خطة التقويم الذاتي — الدليل يشترط صراحةً أربعة عناصر: أهداف عملية
  // التقويم، مؤشرات تحقق الأهداف وآلية متابعتها، توزيع الأدوار
  // والمسؤوليات، ومتطلبات التنفيذ وأدوات التقويم الذاتي — لذا وحدها من
  // بين الأنواع الجديدة تستخدم كل أنواع الأقسام الخمسة، بنفس ثراء الخطة
  // التشغيلية. مخرجاتها (الدليل/الشاهد على كل أداة) تُغذّي خطة التحسين
  // والتطوير والاستدامة التالية.
  const selfEvaluationType = await prisma.planType.upsert({
    where: { key: "self_evaluation" },
    update: { nameAr: "خطة التقويم الذاتي", nameEn: "Self-Evaluation Plan" },
    create: {
      key: "self_evaluation",
      nameAr: "خطة التقويم الذاتي",
      nameEn: "Self-Evaluation Plan",
      isCustom: false,
    },
  });

  const selfEvaluationTemplate = await prisma.planTemplate.upsert({
    where: { planTypeId_version: { planTypeId: selfEvaluationType.id, version: 1 } },
    update: { isActive: true },
    create: { planTypeId: selfEvaluationType.id, version: 1, isActive: true },
  });

  const SELF_EVALUATION_SECTIONS: readonly SectionSeed[] = [
    {
      key: "general_info",
      order: 1,
      titleAr: "معلومات عامة",
      titleEn: "General Information",
      kind: "STATIC_INFO",
      configJson: {
        description:
          "هذا القسم تعريفي بخطة التقويم الذاتي. تُجمَع بيانات التقويم من مصادر متعددة (تحليل الوثائق، الاستبانات، الملاحظة الصفية، ملاحظة البيئة المدرسية، مقابلات المعلمين والمتعلمين والموجه الطالبي). مخرجات هذه الخطة (النتائج والشواهد) هي المدخل الأساسي لخطة التحسين والتطوير والاستدامة.",
      },
    },
    {
      key: "goals",
      order: 2,
      titleAr: "أهداف التقويم الذاتي",
      titleEn: "Self-Evaluation Goals",
      kind: "OBJECTIVES_LIST",
      configJson: {
        itemLabel: "هدف تقويم",
        placeholder: "مثال: تقويم فاعلية الإدارة المدرسية، تقويم جودة التعليم والتعلم…",
      },
    },
    {
      key: "indicators",
      order: 3,
      titleAr: "مؤشرات تحقق الأهداف",
      titleEn: "Achievement Indicators",
      kind: "INDICATORS_LIST",
      configJson: { objectivesSectionKey: "goals" },
    },
    {
      key: "roles",
      order: 4,
      titleAr: "الأدوار والمسؤوليات",
      titleEn: "Roles & Responsibilities",
      kind: "PROGRAMS_LIST",
      configJson: { objectivesSectionKey: "goals", itemLabel: "دور/مسؤولية" },
    },
    {
      key: "tools_execution",
      order: 5,
      titleAr: "أدوات ومتطلبات التنفيذ",
      titleEn: "Tools & Execution Requirements",
      kind: "DETAIL_TABLE",
      configJson: { programsSectionKey: "roles" },
    },
  ] as const;

  await seedSections(selfEvaluationTemplate.id, SELF_EVALUATION_SECTIONS);
  console.log(
    `تمت زراعة نوع الخطة "self_evaluation" وقالبه (${SELF_EVALUATION_SECTIONS.length} أقسام).`
  );

  // خطة التحسين والتطوير والاستدامة — مدخلها الرسمي الأول هو نتائج خطة
  // التقويم الذاتي أعلاه؛ لا يوجد بعد ربط تقني مباشر بين الخطتين (كل خطة
  // Plan مستقلة)، فالقسم التعريفي يوجّه لإدخال النتائج يدويًا استنادًا
  // إلى ملخص خطة التقويم الذاتي لنفس العام الدراسي.
  const improvementPlanType = await prisma.planType.upsert({
    where: { key: "improvement_plan" },
    update: {
      nameAr: "خطة التحسين والتطوير والاستدامة",
      nameEn: "Improvement, Development & Sustainability Plan",
    },
    create: {
      key: "improvement_plan",
      nameAr: "خطة التحسين والتطوير والاستدامة",
      nameEn: "Improvement, Development & Sustainability Plan",
      isCustom: false,
    },
  });

  const improvementPlanTemplate = await prisma.planTemplate.upsert({
    where: { planTypeId_version: { planTypeId: improvementPlanType.id, version: 1 } },
    update: { isActive: true },
    create: { planTypeId: improvementPlanType.id, version: 1, isActive: true },
  });

  const IMPROVEMENT_PLAN_SECTIONS: readonly SectionSeed[] = [
    {
      key: "general_info",
      order: 1,
      titleAr: "معلومات عامة",
      titleEn: "General Information",
      kind: "STATIC_INFO",
      configJson: {
        description:
          "قبل تعبئة هذه الخطة، راجع نتائج خطة التقويم الذاتي لهذا العام الدراسي (النتائج والتغذية الراجعة) — هي المدخل الرسمي الأول لتحديد جوانب التحسين هنا.",
      },
    },
    {
      key: "improvement_areas",
      order: 2,
      titleAr: "جوانب التحسين",
      titleEn: "Improvement Areas",
      kind: "OBJECTIVES_LIST",
      configJson: {
        itemLabel: "جانب تحسين",
        placeholder: "جانب مستخلَص من نتائج التقويم الذاتي والتغذية الراجعة…",
      },
    },
    {
      key: "actions",
      order: 3,
      titleAr: "إجراءات التحسين والاستدامة",
      titleEn: "Improvement & Sustainability Actions",
      kind: "PROGRAMS_LIST",
      configJson: { objectivesSectionKey: "improvement_areas", itemLabel: "إجراء تحسين/استدامة" },
    },
    {
      key: "detail_plan",
      order: 4,
      titleAr: "المسؤوليات والمتابعة",
      titleEn: "Responsibilities & Follow-up",
      kind: "DETAIL_TABLE",
      configJson: { programsSectionKey: "actions" },
    },
  ] as const;

  await seedSections(improvementPlanTemplate.id, IMPROVEMENT_PLAN_SECTIONS);
  console.log(
    `تمت زراعة نوع الخطة "improvement_plan" وقالبه (${IMPROVEMENT_PLAN_SECTIONS.length} أقسام).`
  );

  // الخطة الفصلية — خطة "مُشتقة" لا مُدخَلة: قسمها الوحيد (COMBINED_CALENDAR)
  // يجمع تلقائيًا برامج خطتي التوجيه الطلابي والإرشاد الصحي (صف "الفعاليات")
  // وبرامج خطة النشاط الطلابي (صف "الأنشطة الطلابية") لنفس المدرسة والعام
  // الدراسي، بحسب وسم كل برنامج بأسبوعه في قسم "ربط البرامج بأسابيع الخطة
  // الفصلية" داخل تلك الخطط الثلاث — مع صف "القيم" وحده يُدخَل يدويًا هنا
  // (لا خطة مصدر له). التلوين في الجدول والتصدير يطابق نموذج مدرسي فعلي
  // رُوجِع عند البناء (أزرق=توجيه وإرشاد، أسود=نشاط، بنفسجي=إرشاد صحي).
  const quarterlyType = await prisma.planType.upsert({
    where: { key: "quarterly" },
    update: { nameAr: "الخطة الفصلية", nameEn: "Quarterly Activities & Events Plan" },
    create: {
      key: "quarterly",
      nameAr: "الخطة الفصلية",
      nameEn: "Quarterly Activities & Events Plan",
      isCustom: false,
    },
  });

  const quarterlyTemplate = await prisma.planTemplate.upsert({
    where: { planTypeId_version: { planTypeId: quarterlyType.id, version: 1 } },
    update: { isActive: true },
    create: { planTypeId: quarterlyType.id, version: 1, isActive: true },
  });

  const QUARTERLY_SECTIONS: readonly SectionSeed[] = [
    {
      key: "calendar",
      order: 1,
      titleAr: "الجدول الفصلي للأحداث والأنشطة",
      titleEn: "Quarterly Events & Activities Calendar",
      kind: "COMBINED_CALENDAR",
      configJson: {
        weeksCount: 14,
        rows: [
          {
            key: "activities_events",
            titleAr: "الفعاليات",
            sources: [
              { planTypeKey: "student_guidance", label: "التوجيه والإرشاد", color: "#2563eb" },
              { planTypeKey: "health_guidance", label: "الإرشاد الصحي", color: "#7c3aed" },
            ],
          },
          {
            key: "student_activities",
            titleAr: "الأنشطة الطلابية",
            sources: [{ planTypeKey: "student_activity", label: "النشاط", color: "#111827" }],
          },
        ],
      },
    },
  ] as const;

  await seedSections(quarterlyTemplate.id, QUARTERLY_SECTIONS);
  console.log(`تمت زراعة نوع الخطة "quarterly" وقالبه (${QUARTERLY_SECTIONS.length} أقسام).`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
