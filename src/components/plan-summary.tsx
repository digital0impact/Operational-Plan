import {
  BUILDING_INDEPENDENCE_OPTIONS,
  INITIATIVE_TYPES,
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
  findLabel,
} from "@/lib/constants";

function SwotBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-bold text-ink">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">لا توجد بنود</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-ink">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type SchoolInfo = {
  gender: string;
  schoolSystem: string;
  unit: string;
  buildingIndependence: string | null;
};

type OperationalGoalRow = {
  id: string;
  text: string;
  strategicGoal: { order: number; title: string };
  kpi: { indicator: string; targetValue: string } | null;
  initiatives: { id: string; type: string; name: string }[];
};

/** ملخص الخطة بلا تعديل — يُستخدم في صفحة المشاركة العامة ولوحة الإدارة العامة. */
export function PlanSummary({
  school,
  operationalGoals,
  swot,
  keyIssues,
}: {
  school: SchoolInfo;
  operationalGoals: OperationalGoalRow[];
  swot: { STRENGTH: string[]; WEAKNESS: string[]; OPPORTUNITY: string[]; THREAT: string[] };
  keyIssues: string[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">بيانات المدرسة</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
          <dt className="text-muted">نوع المدرسة</dt>
          <dd className="text-ink">{findLabel(SCHOOL_GENDER_OPTIONS, school.gender)}</dd>
          <dt className="text-muted">التصنيف</dt>
          <dd className="text-ink">
            {findLabel(SCHOOL_CLASSIFICATION_OPTIONS, school.schoolSystem)}
          </dd>
          <dt className="text-muted">المرحلة</dt>
          <dd className="text-ink">{findLabel(SCHOOL_STAGE_OPTIONS, school.unit)}</dd>
          <dt className="text-muted">استقلالية المبنى</dt>
          <dd className="text-ink">
            {findLabel(BUILDING_INDEPENDENCE_OPTIONS, school.buildingIndependence)}
          </dd>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">
          الأهداف التشغيلية ومؤشرات الأداء
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-right text-xs text-muted">
                <th className="py-1.5 pl-2">م</th>
                <th className="py-1.5 pl-2">الهدف التشغيلي</th>
                <th className="py-1.5 pl-2">المؤشر</th>
                <th className="py-1.5">القيمة المستهدفة</th>
              </tr>
            </thead>
            <tbody>
              {operationalGoals.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-0">
                  <td className="py-2 pl-2 text-muted">{g.strategicGoal.order}</td>
                  <td className="py-2 pl-2 text-ink">{g.text || "—"}</td>
                  <td className="py-2 pl-2 text-ink">{g.kpi?.indicator || "—"}</td>
                  <td className="py-2 text-ink">{g.kpi?.targetValue || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <SwotBox title="نقاط القوة" items={swot.STRENGTH} />
        <SwotBox title="نقاط الضعف" items={swot.WEAKNESS} />
        <SwotBox title="الفرص" items={swot.OPPORTUNITY} />
        <SwotBox title="التهديدات" items={swot.THREAT} />
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">القضايا الرئيسية</h2>
        {keyIssues.length === 0 ? (
          <p className="text-sm text-muted">لم تُحدَّد قضايا رئيسية</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {keyIssues.map((issue, i) => (
              <li key={i} className="text-sm text-ink">
                {i + 1}. {issue}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">المبادرات والبرامج</h2>
        <div className="flex flex-col gap-4">
          {operationalGoals.map((g) =>
            g.initiatives.length === 0 ? null : (
              <div key={g.id}>
                <p className="mb-1.5 text-xs font-semibold text-muted">
                  {g.strategicGoal.order}. {g.text || g.strategicGoal.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {g.initiatives.map((initiative) => (
                    <span
                      key={initiative.id}
                      className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-ink"
                    >
                      <span className="text-accent">
                        {INITIATIVE_TYPES[initiative.type as "INITIATIVE" | "PROGRAM"]?.label}
                      </span>{" "}
                      · {initiative.name}
                    </span>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
