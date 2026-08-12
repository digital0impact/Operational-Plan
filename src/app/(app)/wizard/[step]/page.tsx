import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  getCompletedSteps,
  getKeyIssues,
  getOperationalGoals,
  getStrategicGoals,
  getSwotItems,
} from "@/lib/wizard-data";
import {
  INITIATIVE_TYPES,
  SWOT_CATEGORIES,
  TOTAL_WIZARD_STEPS,
  WIZARD_STEP_TITLES,
  detailStepGoalOrder,
} from "@/lib/constants";
import { WizardShell } from "@/components/wizard-shell";
import { Step1Form } from "@/components/step1-form";
import { Step2Form } from "@/components/step2-form";
import { Step3Form } from "@/components/step3-form";
import { Step4Review } from "@/components/wizard/step4-review";
import { StrategicGoalsList } from "@/components/wizard/strategic-goals-list";
import { OperationalGoalsForm } from "@/components/wizard/operational-goals-form";
import { KpiIndicatorForm, KpiTargetForm } from "@/components/wizard/kpi-form";
import { SwotStepForm } from "@/components/wizard/swot-step-form";
import { KeyIssuesForm } from "@/components/wizard/key-issues-form";
import { InitiativesStepForm } from "@/components/wizard/initiatives-step-form";
import { DetailStepForm } from "@/components/wizard/detail-step-form";

function parseStep(raw: string): number | null {
  const step = Number(raw);
  if (!Number.isInteger(step) || step < 1 || step > TOTAL_WIZARD_STEPS) {
    return null;
  }
  return step;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}): Promise<Metadata> {
  const { step: raw } = await params;
  const step = parseStep(raw);
  if (!step) return {};

  if (step >= 16) {
    const order = detailStepGoalOrder(step);
    const goal = await prisma.strategicGoal.findUnique({ where: { order } });
    return { title: `الخطة التفصيلية — ${goal?.title ?? `هدف ${order}`}` };
  }

  return { title: WIZARD_STEP_TITLES[step] };
}

export default async function WizardStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: raw } = await params;
  const step = parseStep(raw);
  if (!step) notFound();

  const user = await getCurrentUser();
  const school = user!.school!;

  // ── الخطوات 1-4: بيانات المدرسة، الأداء، المدخلات، المراجعة ──
  if (step === 1) {
    return (
      <WizardShell
        currentStep={1}
        description="أكمل بيانات المدرسة الرسمية كما وردت في دليل إجراءات عمل مدارس التعليم العام."
      >
        <Step1Form
          defaults={{
            ministryNumber: school.ministryNumber,
            studyTime: school.studyTime,
            studentsCount: school.studentsCount,
            classroomsCount: school.classroomsCount,
            buildingType: school.buildingType,
            educationType: school.educationType,
            buildingIndependence: school.buildingIndependence,
            phone: school.phone,
            schoolEmail: school.schoolEmail,
            address: school.address,
          }}
        />
      </WizardShell>
    );
  }

  if (step === 2) {
    return (
      <WizardShell
        currentStep={2}
        description="حدد مستوى أداء المدرسة العام والمستويات الفرعية الأربعة وفق آخر نتائج تقييم."
      >
        <Step2Form
          defaults={{
            performanceGeneral: school.performanceGeneral,
            performanceManagement: school.performanceManagement,
            performanceTeachingLearning: school.performanceTeachingLearning,
            performanceLearningOutcomes: school.performanceLearningOutcomes,
            performanceEnvironment: school.performanceEnvironment,
          }}
        />
      </WizardShell>
    );
  }

  if (step === 3) {
    const inputs = await prisma.procedureInput.findMany({
      where: { schoolId: school.id },
    });
    const existing = Object.fromEntries(
      inputs.map((input) => [
        input.type,
        { acknowledged: input.acknowledged, note: input.note },
      ])
    );
    return (
      <WizardShell
        currentStep={3}
        description="راجع مدخلات الإجراء الأربعة المعتمدة في الدليل الرسمي قبل صياغة الأهداف."
      >
        <Step3Form existing={existing} />
      </WizardShell>
    );
  }

  if (step === 4) {
    const [inputs, completedSteps] = await Promise.all([
      prisma.procedureInput.findMany({ where: { schoolId: school.id } }),
      getCompletedSteps(school.id),
    ]);
    return (
      <WizardShell
        currentStep={4}
        description="راجع كل ما تم إدخاله قبل اعتماد هذا الجزء من الخطة التشغيلية."
      >
        <Step4Review
          school={school}
          acknowledgedCount={inputs.filter((i) => i.acknowledged).length}
          alreadyConfirmed={completedSteps.has(4)}
        />
      </WizardShell>
    );
  }

  // ── الخطوة 5: الأهداف الاستراتيجية الثابتة ──
  if (step === 5) {
    const strategicGoals = await getStrategicGoals();
    return (
      <WizardShell
        currentStep={5}
        description="هذه الأهداف صادرة من وزارة التعليم وتُبنى عليها خطة كل مدرسة."
      >
        <StrategicGoalsList goals={strategicGoals} />
      </WizardShell>
    );
  }

  // ── الخطوة 6: الأهداف التشغيلية للمدرسة ──
  if (step === 6) {
    const [strategicGoals, operationalGoals] = await Promise.all([
      getStrategicGoals(),
      getOperationalGoals(school.id),
    ]);
    const textByGoal = new Map(
      operationalGoals.map((g) => [g.strategicGoalId, g.text])
    );
    return (
      <WizardShell
        currentStep={6}
        description="لكل هدف استراتيجي، اكتب الهدف التشغيلي الذي ستعمل عليه المدرسة هذا العام."
      >
        <OperationalGoalsForm
          goals={strategicGoals.map((g) => ({
            strategicGoalId: g.id,
            order: g.order,
            title: g.title,
            text: textByGoal.get(g.id) ?? "",
          }))}
        />
      </WizardShell>
    );
  }

  // ── الخطوتان 7-8: مؤشرات الأداء والقيم المستهدفة ──
  if (step === 7 || step === 8) {
    const operationalGoals = await getOperationalGoals(school.id);
    const rows = operationalGoals.map((g) => ({
      operationalGoalId: g.id,
      order: g.strategicGoal.order,
      strategicTitle: g.strategicGoal.title,
      operationalText: g.text,
      indicator: g.kpi?.indicator ?? "",
      targetValue: g.kpi?.targetValue ?? "",
    }));

    if (operationalGoals.length === 0) {
      return (
        <WizardShell currentStep={step} description="أكمل الخطوة 6 أولًا.">
          <p className="text-sm text-muted">
            لم تُضف أهداف تشغيلية بعد — أكمل الخطوة السابقة أولًا.
          </p>
        </WizardShell>
      );
    }

    return (
      <WizardShell
        currentStep={step}
        description={
          step === 7
            ? "حدد مؤشر قياس أداء واحدًا لكل هدف تشغيلي."
            : "حدد القيمة المستهدفة لكل مؤشر."
        }
      >
        {step === 7 ? (
          <KpiIndicatorForm goals={rows} />
        ) : (
          <KpiTargetForm goals={rows} />
        )}
      </WizardShell>
    );
  }

  // ── الخطوات 9-12: تحليل SWOT ──
  if (step >= 9 && step <= 12) {
    const category = SWOT_CATEGORIES.find((c) => c.step === step)!;
    const swot = await getSwotItems(school.id);
    const items = swot[category.value as keyof typeof swot];

    const hints: Record<string, string> = {
      STRENGTH: "ما الجوانب التي تتميز بها المدرسة حاليًا؟",
      WEAKNESS: "ما الجوانب التي تحتاج إلى تحسين داخل المدرسة؟",
      OPPORTUNITY: "ما العوامل الخارجية التي يمكن الاستفادة منها؟",
      THREAT: "ما العوامل الخارجية التي قد تؤثر سلبًا على المدرسة؟",
    };
    const nextLabels: Record<string, string> = {
      STRENGTH: "حفظ ومتابعة إلى نقاط الضعف ←",
      WEAKNESS: "حفظ ومتابعة إلى الفرص ←",
      OPPORTUNITY: "حفظ ومتابعة إلى التهديدات ←",
      THREAT: "حفظ ومتابعة إلى القضايا الرئيسية ←",
    };

    return (
      <WizardShell
        currentStep={step}
        description="جزء من تحليل SWOT لواقع المدرسة."
      >
        <SwotStepForm
          category={category.value}
          step={step}
          items={items}
          hint={hints[category.value]}
          nextLabel={nextLabels[category.value]}
        />
      </WizardShell>
    );
  }

  // ── الخطوة 13: القضايا الرئيسية ──
  if (step === 13) {
    const items = await getKeyIssues(school.id);
    return (
      <WizardShell
        currentStep={13}
        description="القضايا الرئيسية التي ستعالجها المبادرات والبرامج."
      >
        <KeyIssuesForm items={items} />
      </WizardShell>
    );
  }

  // ── الخطوتان 14-15: المبادرات والبرامج ──
  if (step === 14 || step === 15) {
    const type = step === 14 ? INITIATIVE_TYPES.INITIATIVE : INITIATIVE_TYPES.PROGRAM;
    const operationalGoals = await getOperationalGoals(school.id);

    if (operationalGoals.length === 0) {
      return (
        <WizardShell currentStep={step} description="أكمل الخطوة 6 أولًا.">
          <p className="text-sm text-muted">
            لم تُضف أهداف تشغيلية بعد — أكمل الخطوة 6 أولًا.
          </p>
        </WizardShell>
      );
    }

    return (
      <WizardShell
        currentStep={step}
        description={`أضف ${type.label} واحدًا أو أكثر لكل هدف تشغيلي.`}
      >
        <InitiativesStepForm
          type={type.value}
          step={step}
          itemLabel={type.label}
          goals={operationalGoals.map((g) => ({
            operationalGoalId: g.id,
            order: g.strategicGoal.order,
            title: g.text || g.strategicGoal.title,
            items: g.initiatives
              .filter((i) => i.type === type.value)
              .map((i) => i.name),
          }))}
        />
      </WizardShell>
    );
  }

  // ── الخطوات 16-25: الجدول التفصيلي لكل هدف استراتيجي ──
  const goalOrder = detailStepGoalOrder(step);
  const operationalGoals = await getOperationalGoals(school.id);
  const goal = operationalGoals.find((g) => g.strategicGoal.order === goalOrder);

  const initiatives = (goal?.initiatives ?? []).map((initiative) => {
    const actionItem = initiative.actionItems[0];
    return {
      id: initiative.id,
      type: initiative.type,
      name: initiative.name,
      activity: actionItem?.activity ?? "",
      targetCategory: actionItem?.targetCategory ?? "",
      executionRequirements: actionItem?.executionRequirements ?? "",
      executionDate: actionItem?.executionDate ?? "",
      responsible: actionItem?.responsible ?? "",
      evidence: actionItem?.evidence ?? "",
    };
  });

  return (
    <WizardShell
      currentStep={step}
      title={
        goal
          ? `الخطة التفصيلية — ${goal.strategicGoal.title}`
          : `الخطة التفصيلية — هدف ${goalOrder}`
      }
      description={
        goal?.text
          ? `الهدف التشغيلي: ${goal.text}`
          : "أكمل الخطوة 6 لهذا الهدف أولًا."
      }
    >
      <DetailStepForm step={step} initiatives={initiatives} />
    </WizardShell>
  );
}
