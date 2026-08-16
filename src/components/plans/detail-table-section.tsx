"use client";

import { useActionState } from "react";
import { savePlanDetailSectionAction } from "@/app/actions/plans";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

type ObjectiveDetailRow = {
  objectiveId: string;
  text: string;
  programs: {
    programId: string;
    name: string;
    activity: string;
    targetCategory: string;
    executionRequirements: string;
    executionDate: string;
    responsible: string;
    supervisor: string;
    estimatedBudget: string;
    regulatorySecurityRequirements: string;
    planningNote: string;
    evidence: string;
  }[];
};

export function DetailTableSection({
  planId,
  sectionKey,
  rows,
}: {
  planId: string;
  sectionKey: string;
  rows: ObjectiveDetailRow[];
}) {
  const action = savePlanDetailSectionAction.bind(null, planId, sectionKey);
  const [state, formAction] = useActionState(action, initialState);

  const hasAnyProgram = rows.some((r) => r.programs.length > 0);
  if (!hasAnyProgram) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        لا توجد أنشطة أو برامج بعد — أضفها في القسم السابق قبل تعبئة الخطة التفصيلية.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
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
                  <p className="mb-3 text-sm font-semibold text-ink">{program.name}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-xs font-semibold text-muted">الأنشطة</span>
                      <textarea
                        name={`activity_${program.programId}`}
                        defaultValue={program.activity}
                        rows={2}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted">الفئة المستهدفة</span>
                      <input
                        name={`category_${program.programId}`}
                        defaultValue={program.targetCategory}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted">متطلبات التنفيذ</span>
                      <input
                        name={`requirements_${program.programId}`}
                        defaultValue={program.executionRequirements}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted">تاريخ التنفيذ</span>
                      <input
                        name={`date_${program.programId}`}
                        defaultValue={program.executionDate}
                        placeholder="مثال: الفصل الدراسي الأول"
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted">التنفيذ والمسؤولية</span>
                      <input
                        name={`responsible_${program.programId}`}
                        defaultValue={program.responsible}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted">
                        المشرف
                      </span>
                      <input
                        name={`supervisor_${program.programId}`}
                        defaultValue={program.supervisor}
                        placeholder="يُختار وفق التخصص والخبرات والمهارات"
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted">
                        الميزانية التقديرية
                      </span>
                      <input
                        name={`budget_${program.programId}`}
                        defaultValue={program.estimatedBudget}
                        placeholder="مثال: 2000 ريال"
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted">
                        الاشتراطات النظامية والأمنية
                      </span>
                      <input
                        name={`regulatory_${program.programId}`}
                        defaultValue={program.regulatorySecurityRequirements}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-xs font-semibold text-muted">
                        ملاحظة تخطيط (موافقة إدارة التعليم لبرنامج خارج الخطة، أو ارتباطه
                        بمناسبة محلية/دولية)
                      </span>
                      <input
                        name={`planningNote_${program.programId}`}
                        defaultValue={program.planningNote}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-xs font-semibold text-muted">الشواهد</span>
                      <input
                        name={`evidence_${program.programId}`}
                        defaultValue={program.evidence}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">حفظ وإنهاء الخطة ←</SubmitButton>
    </form>
  );
}
