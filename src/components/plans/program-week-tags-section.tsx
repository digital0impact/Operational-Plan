"use client";

import { useActionState } from "react";
import { saveProgramWeekTagsSectionAction } from "@/app/actions/plans";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

type ProgramWeekRow = {
  objectiveId: string;
  text: string;
  programs: { programId: string; name: string; weeks: number[] }[];
};

/**
 * PROGRAM_WEEK_TAGS — يربط كل برنامج بأسبوع أو أكثر من أسابيع "الخطة
 * الفصلية"، فتُبنى تلك الخطة تلقائيًا من هذا الوسم (بلا إدخال مزدوج).
 */
export function ProgramWeekTagsSection({
  planId,
  sectionKey,
  weeksCount,
  rows,
}: {
  planId: string;
  sectionKey: string;
  weeksCount: number;
  rows: ProgramWeekRow[];
}) {
  const action = saveProgramWeekTagsSectionAction.bind(null, planId, sectionKey);
  const [state, formAction] = useActionState(action, initialState);

  const hasAnyProgram = rows.some((r) => r.programs.length > 0);
  if (!hasAnyProgram) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        لا توجد برامج بعد — أضفها في القسم السابق قبل ربطها بأسابيع الخطة الفصلية.
      </p>
    );
  }

  const weeks = Array.from({ length: weeksCount }, (_, i) => i + 1);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        حدّد لكل برنامج الأسابيع التي يُنفَّذ فيها — يمكن اختيار أكثر من أسبوع
        للبرنامج المستمر. تُبنى &quot;الخطة الفصلية&quot; تلقائيًا من هذا الربط.
      </p>

      {rows.map(
        (row) =>
          row.programs.length > 0 && (
            <div key={row.objectiveId} className="flex flex-col gap-3">
              <p className="text-sm font-bold text-ink">{row.text}</p>
              {row.programs.map((program) => (
                <div
                  key={program.programId}
                  className="rounded-lg border border-border bg-surface-2 p-4"
                >
                  <p className="mb-2.5 text-sm font-semibold text-ink">{program.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {weeks.map((week) => (
                      <label key={week} className="cursor-pointer">
                        <input
                          type="checkbox"
                          name={`weeks_${program.programId}`}
                          value={week}
                          defaultChecked={program.weeks.includes(week)}
                          className="peer sr-only"
                        />
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-xs text-ink transition peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-semibold peer-checked:text-accent">
                          {week}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">حفظ ومتابعة ←</SubmitButton>
    </form>
  );
}
