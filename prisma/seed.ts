import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
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
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
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

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
