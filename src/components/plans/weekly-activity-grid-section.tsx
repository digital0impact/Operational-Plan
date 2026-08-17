"use client";

import { useState } from "react";
import { useActionState } from "react";
import { saveWeeklyGridSectionAction } from "@/app/actions/plans";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { error: null };

let counter = 0;
function nextKey() {
  counter += 1;
  return `grid-row-${counter}-${Date.now().toString(36)}`;
}

type GridWeek = { order: number; label: string };
type GridRow = { id: string; order: number; label: string; cells: string[] };

/**
 * جدول أسبوعي (صف × أسبوع) — عدد الأسابيع ثابت (weeks، من configJson لقسم
 * القالب)، وعدد الصفوف حرّ يديره مدير المدرسة (إضافة/حذف). هوية كل صف
 * "موضعية" بترتيب عرضه (index)، لا بمعرّف ثابت — يطابق ما تتوقعه
 * saveWeeklyGridSectionAction من أسماء الحقول rowLabel_{index}/cell_{index}_{weekOrder}.
 * محتوى كل خلية نص حر متعدد الأسطر، دون تقسيمه لحقول فرعية (مجال/برنامج/اسم)،
 * ليطابق التنوع الفعلي في نماذج المدارس الورقية.
 */
export function WeeklyActivityGridSection({
  planId,
  sectionKey,
  weeks,
  initialRows,
}: {
  planId: string;
  sectionKey: string;
  weeks: GridWeek[];
  initialRows: GridRow[];
}) {
  const action = saveWeeklyGridSectionAction.bind(null, planId, sectionKey);
  const [state, formAction] = useActionState(action, initialState);

  const [rows, setRows] = useState(() =>
    initialRows.length > 0
      ? initialRows.map((row) => ({ key: nextKey(), label: row.label, cells: row.cells }))
      : [{ key: nextKey(), label: "", cells: weeks.map(() => "") }]
  );

  function addRow() {
    setRows((current) => [
      ...current,
      { key: nextKey(), label: "", cells: weeks.map(() => "") },
    ]);
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((r) => r.key !== key));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        أضف صفًا لكل صف دراسي أو فئة تريد جدولتها، ثم دوّن نشاط كل أسبوع في
        خليته — يمكن أن تجمع الخلية الواحدة المجال والبرنامج واسم القائدة معًا.
      </p>

      <input type="hidden" name="rowCount" value={rows.length} />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2">
              <th className="sticky right-0 z-10 min-w-[160px] border-b border-l border-border bg-surface-2 p-2 text-right text-xs font-semibold text-muted">
                الصف / الفئة
              </th>
              {weeks.map((week) => (
                <th
                  key={week.order}
                  className="min-w-[150px] border-b border-l border-border p-2 text-right text-xs font-semibold text-muted"
                >
                  <div className="mb-1 font-mono text-[11px] text-accent">
                    الأسبوع {week.order}
                  </div>
                  <input
                    name={`weekLabel_${week.order}`}
                    defaultValue={week.label}
                    placeholder="مثال: ٣/١ – ٣/٥"
                    className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  />
                </th>
              ))}
              <th className="w-10 border-b border-border p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key} className="align-top">
                <td className="sticky right-0 z-10 border-b border-l border-border bg-surface p-2">
                  <input
                    name={`rowLabel_${index}`}
                    defaultValue={row.label}
                    placeholder="اسم الصف/الفئة…"
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-semibold text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  />
                </td>
                {weeks.map((week, weekIndex) => (
                  <td key={week.order} className="border-b border-l border-border p-2">
                    <textarea
                      name={`cell_${index}_${week.order}`}
                      defaultValue={row.cells[weekIndex] ?? ""}
                      rows={2}
                      className="w-full resize-y rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                    />
                  </td>
                ))}
                <td className="border-b border-border p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted transition hover:border-danger hover:text-danger"
                    aria-label="حذف الصف"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="self-start rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-accent transition hover:border-accent"
      >
        + إضافة صف
      </button>

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">حفظ ومتابعة ←</SubmitButton>
    </form>
  );
}
