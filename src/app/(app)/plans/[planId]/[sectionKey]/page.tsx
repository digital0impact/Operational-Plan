import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getDetailPlanData,
  getIndicatorsData,
  getObjectivesForSection,
  getProgramsData,
  loadPlanShell,
  sectionConfigString,
} from "@/lib/plan-data";
import { PlanShell } from "@/components/plan-shell";
import { StaticInfoSection } from "@/components/plans/static-info-section";
import { ObjectivesListSection } from "@/components/plans/objectives-list-section";
import { IndicatorsListSection } from "@/components/plans/indicators-list-section";
import { ProgramsListSection } from "@/components/plans/programs-list-section";
import { DetailTableSection } from "@/components/plans/detail-table-section";

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
