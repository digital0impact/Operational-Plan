import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getCombinedCalendarData,
  getDetailPlanData,
  getIndicatorsData,
  getObjectivesForSection,
  getProgramWeekTagsData,
  getProgramsData,
  getWeeklyGridData,
  loadPlanShell,
  sectionConfigNumber,
  sectionConfigString,
} from "@/lib/plan-data";
import { PlanShell } from "@/components/plan-shell";
import { StaticInfoSection } from "@/components/plans/static-info-section";
import { ObjectivesListSection } from "@/components/plans/objectives-list-section";
import { IndicatorsListSection } from "@/components/plans/indicators-list-section";
import { ProgramsListSection } from "@/components/plans/programs-list-section";
import { DetailTableSection } from "@/components/plans/detail-table-section";
import { WeeklyActivityGridSection } from "@/components/plans/weekly-activity-grid-section";
import { ProgramWeekTagsSection } from "@/components/plans/program-week-tags-section";
import { CombinedCalendarRows } from "@/components/plans/combined-calendar-rows";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ planId: string; sectionKey: string }>;
}): Promise<Metadata> {
  const { planId, sectionKey } = await params;
  const user = await getCurrentUser();
  if (!user?.schoolId) return {};
  const shell = await loadPlanShell(user.schoolId, planId);
  const section = shell?.sections.find((s) => s.key === sectionKey);
  return { title: section?.titleAr ?? "خطة" };
}

export default async function PlanSectionPage({
  params,
}: {
  params: Promise<{ planId: string; sectionKey: string }>;
}) {
  const { planId, sectionKey } = await params;
  const user = await getCurrentUser();
  const schoolId = user!.schoolId!;

  const shell = await loadPlanShell(schoolId, planId);
  if (!shell) notFound();

  const section = shell.sections.find((s) => s.key === sectionKey);
  if (!section) notFound();

  let body: React.ReactNode;

  switch (section.kind) {
    case "STATIC_INFO": {
      body = (
        <StaticInfoSection
          planId={planId}
          sectionKey={sectionKey}
          description={
            sectionConfigString(section.configJson, "description") ??
            "راجع بيانات هذا القسم ثم تابع."
          }
        />
      );
      break;
    }

    case "OBJECTIVES_LIST": {
      const items = await getObjectivesForSection(planId, sectionKey);
      body = (
        <ObjectivesListSection
          planId={planId}
          sectionKey={sectionKey}
          itemLabel={sectionConfigString(section.configJson, "itemLabel") ?? "عنصر"}
          placeholder={sectionConfigString(section.configJson, "placeholder")}
          initialItems={items.map((i) => i.text)}
        />
      );
      break;
    }

    case "INDICATORS_LIST": {
      const objectivesSectionKey = sectionConfigString(
        section.configJson,
        "objectivesSectionKey"
      );
      const rows = objectivesSectionKey
        ? await getIndicatorsData(planId, objectivesSectionKey)
        : [];
      body = <IndicatorsListSection planId={planId} sectionKey={sectionKey} rows={rows} />;
      break;
    }

    case "PROGRAMS_LIST": {
      const objectivesSectionKey = sectionConfigString(
        section.configJson,
        "objectivesSectionKey"
      );
      const rows = objectivesSectionKey
        ? await getProgramsData(planId, objectivesSectionKey)
        : [];
      body = (
        <ProgramsListSection
          planId={planId}
          sectionKey={sectionKey}
          itemLabel={sectionConfigString(section.configJson, "itemLabel") ?? "برنامج"}
          rows={rows}
        />
      );
      break;
    }

    case "DETAIL_TABLE": {
      const programsSectionKey = sectionConfigString(section.configJson, "programsSectionKey");
      const rows = programsSectionKey
        ? await getDetailPlanData(shell.templateId, planId, programsSectionKey)
        : [];
      body = <DetailTableSection planId={planId} sectionKey={sectionKey} rows={rows} />;
      break;
    }

    case "WEEKLY_ACTIVITY_GRID": {
      const weeksCount = sectionConfigNumber(section.configJson, "weeksCount") ?? 18;
      const grid = await getWeeklyGridData(planId, sectionKey, weeksCount);
      body = (
        <WeeklyActivityGridSection
          planId={planId}
          sectionKey={sectionKey}
          weeks={grid.weeks}
          initialRows={grid.rows}
        />
      );
      break;
    }

    case "PROGRAM_WEEK_TAGS": {
      const programsSectionKey = sectionConfigString(section.configJson, "programsSectionKey");
      const weeksCount = sectionConfigNumber(section.configJson, "weeksCount") ?? 14;
      const rows = programsSectionKey
        ? await getProgramWeekTagsData(shell.templateId, planId, programsSectionKey)
        : [];
      body = (
        <ProgramWeekTagsSection
          planId={planId}
          sectionKey={sectionKey}
          weeksCount={weeksCount}
          rows={rows}
        />
      );
      break;
    }

    case "COMBINED_CALENDAR": {
      const calendar = await getCombinedCalendarData(schoolId, planId);
      body = calendar ? (
        <div className="flex flex-col gap-6">
          <CombinedCalendarRows weeks={calendar.weeks} computedRows={calendar.computedRows} />
          <div className="border-t border-border pt-6">
            <p className="mb-4 text-sm text-muted">
              الصفّان أعلاه يُشتقّان تلقائيًا من الأسابيع المربوطة ببرامج خطط
              التوجيه الطلابي والإرشاد الصحي والنشاط الطلابي — لا تُدخَل هنا.
              أضف أدناه صف &quot;القيم&quot; (لا خطة مصدر له) وسمِّ الأسابيع إن رغبت.
            </p>
            <WeeklyActivityGridSection
              planId={planId}
              sectionKey={sectionKey}
              weeks={calendar.weeks}
              initialRows={calendar.valueRows}
            />
          </div>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted">تعذّر تحميل الخطة الفصلية.</p>
      );
      break;
    }

    default: {
      body = (
        <p className="py-6 text-center text-sm text-muted">
          هذا النوع من الأقسام («{section.kind}») غير مُنفَّذ بعد في واجهة الخطط
          العامة.
        </p>
      );
    }
  }

  return (
    <PlanShell
      planId={planId}
      planTypeName={shell.planType.nameAr}
      academicYear={shell.academicYear}
      sections={shell.sections}
      currentSectionKey={sectionKey}
      completedKeys={shell.completedKeys}
    >
      {body}
    </PlanShell>
  );
}
