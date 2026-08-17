type CombinedCalendarComputedRow = {
  titleAr: string;
  legend: { label: string; color: string }[];
  weeks: { weekOrder: number; items: { text: string; color: string }[] }[];
};

/**
 * صفوف "الخطة الفصلية" المُشتقّة تلقائيًا (لا تُدخَل هنا، فقط تُعرَض) — كل
 * عنصر ملوَّن بلون خطته المصدر (مطابقة لنموذج مدرسي فعلي بُني عليه هذا
 * التصميم). تُعرَض فوق نموذج تحرير صف "القيم" (WeeklyActivityGridSection).
 */
export function CombinedCalendarRows({
  weeks,
  computedRows,
}: {
  weeks: { order: number; label: string }[];
  computedRows: CombinedCalendarComputedRow[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {computedRows.map((row) => (
        <div key={row.titleAr}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-ink">{row.titleAr}</h3>
            <div className="flex flex-wrap gap-3">
              {row.legend.map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-surface-2">
                  {weeks.map((w) => (
                    <th
                      key={w.order}
                      className="min-w-[130px] border-b border-l border-border p-2 text-right font-semibold text-muted"
                    >
                      الأسبوع {w.order}
                      {w.label ? (
                        <div className="mt-0.5 font-mono text-[10px] font-normal text-muted">
                          {w.label}
                        </div>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {row.weeks.map((wk) => (
                    <td
                      key={wk.weekOrder}
                      className="border-b border-l border-border p-2 align-top"
                    >
                      {wk.items.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {wk.items.map((item, i) => (
                            <li key={i} style={{ color: item.color }} className="font-medium">
                              {item.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
