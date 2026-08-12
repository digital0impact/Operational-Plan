import "server-only";
import { chromium, type LaunchOptions } from "playwright-core";
import { prisma } from "@/lib/db";
import {
  getKeyIssues,
  getOperationalGoals,
  getSwotItems,
} from "@/lib/wizard-data";
import { buildPlanHtml, type PlanData } from "@/lib/pdf/template";

/**
 * خيارات تشغيل Chromium حسب البيئة:
 * - PDF_CHROMIUM_PATH مضبوط صراحة → استخدمه كما هو (خادم مخصَّص).
 * - على Vercel (بيئة serverless بلا Chromium مثبَّت مسبقًا وبنظام ملفات
 *   للقراءة فقط عدا /tmp) → استخدم @sparticuz/chromium، وهو بناء Chromium
 *   مضغوط مخصَّص لبيئات Lambda/Vercel يُستخرَج إلى /tmp عند أول استدعاء.
 * - غير ذلك (بيئة التطوير الحالية) → المسار المثبَّت مسبقًا في هذا الصندوق.
 */
async function resolveLaunchOptions(): Promise<LaunchOptions> {
  if (process.env.PDF_CHROMIUM_PATH) {
    return {
      executablePath: process.env.PDF_CHROMIUM_PATH,
      args: ["--no-sandbox"],
    };
  }

  if (process.env.VERCEL) {
    const { default: sparticuzChromium } = await import("@sparticuz/chromium");
    return {
      executablePath: await sparticuzChromium.executablePath(),
      args: sparticuzChromium.args,
    };
  }

  return {
    executablePath: "/opt/pw-browsers/chromium",
    args: ["--no-sandbox"],
  };
}

async function loadPlanData(schoolId: string): Promise<PlanData> {
  const [school, manager, procedureInputs, strategicGoals, operationalGoals, swot, keyIssues] =
    await Promise.all([
      prisma.school.findUniqueOrThrow({ where: { id: schoolId } }),
      prisma.user.findFirst({
        where: { schoolId, role: "SCHOOL_MANAGER" },
        orderBy: { createdAt: "asc" },
      }),
      prisma.procedureInput.findMany({ where: { schoolId } }),
      prisma.strategicGoal.findMany({ orderBy: { order: "asc" } }),
      getOperationalGoals(schoolId),
      getSwotItems(schoolId),
      getKeyIssues(schoolId),
    ]);

  return {
    school,
    managerName: manager?.name ?? "—",
    procedureInputs: procedureInputs.map((i) => ({
      type: i.type,
      acknowledged: i.acknowledged,
    })),
    strategicGoals: strategicGoals.map((g) => ({ order: g.order, title: g.title })),
    operationalGoals: operationalGoals.map((g) => ({
      order: g.strategicGoal.order,
      strategicTitle: g.strategicGoal.title,
      text: g.text,
      indicator: g.kpi?.indicator ?? "",
      targetValue: g.kpi?.targetValue ?? "",
      initiatives: g.initiatives.map((i) => ({
        type: i.type as "INITIATIVE" | "PROGRAM",
        name: i.name,
        actionItem: i.actionItems[0]
          ? {
              activity: i.actionItems[0].activity,
              targetCategory: i.actionItems[0].targetCategory,
              executionRequirements: i.actionItems[0].executionRequirements,
              executionDate: i.actionItems[0].executionDate,
              responsible: i.actionItems[0].responsible,
              evidence: i.actionItems[0].evidence,
            }
          : null,
      })),
    })),
    swot,
    keyIssues,
    generatedAt: new Date(),
  };
}

export async function renderSchoolPlanPdf(schoolId: string): Promise<Buffer> {
  const data = await loadPlanData(schoolId);
  const html = buildPlanHtml(data);

  const browser = await chromium.launch(await resolveLaunchOptions());

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
