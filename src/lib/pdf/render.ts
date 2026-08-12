import "server-only";
import { chromium } from "playwright-core";
import { prisma } from "@/lib/db";
import {
  getKeyIssues,
  getOperationalGoals,
  getSwotItems,
} from "@/lib/wizard-data";
import { buildPlanHtml, type PlanData } from "@/lib/pdf/template";

// في بيئة التطوير الحالية يتوفر Chromium مثبَّتًا مسبقًا في هذا المسار.
// في بيئة إنتاج مختلفة، اضبط PDF_CHROMIUM_PATH على مسار تنفيذي Chromium/Chrome.
const CHROMIUM_PATH =
  process.env.PDF_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

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

  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    args: ["--no-sandbox"],
  });

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
