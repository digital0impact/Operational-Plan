import { CopyLink } from "@/components/copy-link";
import { deleteVisitAction } from "@/app/actions/visits";
import { VISIT_STATUS_LABELS } from "@/lib/constants";

type VisitRow = {
  id: string;
  teacherName: string;
  subject: string | null;
  className: string | null;
  scheduledAt: Date;
  purpose: string | null;
  status: string;
  responseToken: string;
  responseNote: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-surface-2 text-muted",
  CONFIRMED: "bg-accent-soft text-accent",
  RESCHEDULE_REQUESTED: "bg-danger-soft text-danger",
};

const dateFormatter = new Intl.DateTimeFormat("ar", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function VisitsList({ visits }: { visits: VisitRow[] }) {
  if (visits.length === 0) {
    return <p className="text-sm text-muted">لم تُجدوَل أي زيارات صفية بعد.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {visits.map((visit) => (
        <div
          key={visit.id}
          className="rounded-lg border border-border bg-surface-2 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">
                {visit.teacherName}
                {visit.subject ? (
                  <span className="font-normal text-muted"> · {visit.subject}</span>
                ) : null}
                {visit.className ? (
                  <span className="font-normal text-muted"> · {visit.className}</span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-muted">
                {dateFormatter.format(visit.scheduledAt)}
              </p>
              {visit.purpose ? (
                <p className="mt-1.5 text-sm text-ink">{visit.purpose}</p>
              ) : null}
            </div>
            <span
              className={
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
                (STATUS_STYLES[visit.status] ?? "bg-surface-2 text-muted")
              }
            >
              {VISIT_STATUS_LABELS[visit.status] ?? visit.status}
            </span>
          </div>

          {visit.responseNote ? (
            <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs text-ink">
              <span className="font-semibold text-muted">ملاحظة المعلم/ة: </span>
              {visit.responseNote}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CopyLink
                path={`/visit/${visit.responseToken}`}
                label="رابط الرد"
              />
            </div>
            <form action={deleteVisitAction.bind(null, visit.id)}>
              <button
                type="submit"
                className="text-xs text-muted hover:text-danger"
              >
                حذف
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
