import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
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

  // رمز تفعيل تجريبي لاختبار التسجيل محليًا
  const demoCode = "SCH-DEMO-0001";
  await prisma.activationCode.upsert({
    where: { code: demoCode },
    update: {},
    create: { code: demoCode, issuedFor: "مدرسة تجريبية — للاختبار المحلي" },
  });
  console.log(`رمز التفعيل التجريبي: ${demoCode}`);

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

  for (const section of OPERATIONAL_SECTIONS) {
    await prisma.planTemplateSection.upsert({
      where: {
        templateId_key: { templateId: operationalTemplate.id, key: section.key },
      },
      update: {
        order: section.order,
        titleAr: section.titleAr,
        titleEn: section.titleEn,
        kind: section.kind,
        configJson: section.configJson,
      },
      create: {
        templateId: operationalTemplate.id,
        key: section.key,
        order: section.order,
        titleAr: section.titleAr,
        titleEn: section.titleEn,
        kind: section.kind,
        configJson: section.configJson,
      },
    });
  }
  console.log(
    `تمت زراعة نوع الخطة "operational" وقالبه (${OPERATIONAL_SECTIONS.length} أقسام).`
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
