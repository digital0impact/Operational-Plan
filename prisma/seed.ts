import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

// الأهداف الاستراتيجية العشرة لوزارة التعليم — كما وردت حرفيًا في
// "دليل إجراءات عمل مدارس التعليم العام 2025م" (إعداد الخطة التشغيلية، صفحة 3)
const OPERATIONAL_PLAN_TYPE_KEY = "SCHOOL_OPERATIONAL" as const;
const OPERATIONAL_TEMPLATE_KEY = "OFFICIAL_OPERATIONAL_1447_1448";
const CURRENT_ACADEMIC_YEAR = "1447-1448";

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

  const operationalPlanType = await prisma.planType.upsert({
    where: { key: OPERATIONAL_PLAN_TYPE_KEY },
    update: {
      nameAr: "الخطة التشغيلية المدرسية",
      nameEn: "School Operational Plan",
      description:
        "نوع الخطة التشغيلية المدرسية الحالي؛ يبقى مستقلًا عن جداول الخطة التشغيلية القائمة في مرحلة التأسيس.",
      isSystem: true,
      isActive: true,
    },
    create: {
      key: OPERATIONAL_PLAN_TYPE_KEY,
      nameAr: "الخطة التشغيلية المدرسية",
      nameEn: "School Operational Plan",
      description:
        "نوع الخطة التشغيلية المدرسية الحالي؛ يبقى مستقلًا عن جداول الخطة التشغيلية القائمة في مرحلة التأسيس.",
      isSystem: true,
      isActive: true,
    },
  });

  await prisma.planTemplate.upsert({
    where: { key: OPERATIONAL_TEMPLATE_KEY },
    update: {
      planTypeId: operationalPlanType.id,
      version: CURRENT_ACADEMIC_YEAR,
      nameAr: "القالب الرسمي للخطة التشغيلية 1447-1448هـ",
      nameEn: "Official Operational Plan 1447-1448 Template",
      description:
        "بيانات وصفية فقط لقالب المعالج التشغيلي الحالي المكوّن من 25 خطوة؛ لا يستبدل تنفيذ المعالج الحالي في هذه المرحلة.",
      schemaJson: {
        wizard: { type: "existing_operational_wizard", totalSteps: 25, metadataOnly: true },
      },
      isPublished: true,
    },
    create: {
      planTypeId: operationalPlanType.id,
      key: OPERATIONAL_TEMPLATE_KEY,
      version: CURRENT_ACADEMIC_YEAR,
      nameAr: "القالب الرسمي للخطة التشغيلية 1447-1448هـ",
      nameEn: "Official Operational Plan 1447-1448 Template",
      description:
        "بيانات وصفية فقط لقالب المعالج التشغيلي الحالي المكوّن من 25 خطوة؛ لا يستبدل تنفيذ المعالج الحالي في هذه المرحلة.",
      schemaJson: {
        wizard: { type: "existing_operational_wizard", totalSteps: 25, metadataOnly: true },
      },
      isPublished: true,
    },
  });
  console.log("تمت زراعة نوع وقالب الخطة التشغيلية المدرسية.");

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

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
