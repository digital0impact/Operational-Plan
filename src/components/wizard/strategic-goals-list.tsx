import { completeStep5Action } from "@/app/actions/wizard";
import { SubmitButton } from "@/components/submit-button";

export function StrategicGoalsList({
  goals,
}: {
  goals: { order: number; title: string }[];
}) {
  return (
    <form action={completeStep5Action} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        هذه الأهداف الاستراتيجية العشرة لوزارة التعليم ثابتة ولا يمكن
        تعديلها — ستُبنى عليها الأهداف التشغيلية للمدرسة في الخطوة التالية.
      </p>

      <ol className="flex flex-col gap-2">
        {goals.map((goal) => (
          <li
            key={goal.order}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-3.5"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[11px] font-bold text-accent-ink">
              {goal.order}
            </span>
            <span className="text-sm text-ink">{goal.title}</span>
          </li>
        ))}
      </ol>

      <SubmitButton pendingLabel="جارٍ المتابعة…">
        متابعة إلى الأهداف التشغيلية ←
      </SubmitButton>
    </form>
  );
}
