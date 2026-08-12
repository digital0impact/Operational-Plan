import Link from "next/link";
import {
  TOTAL_WIZARD_STEPS,
  WIZARD_STAGES,
  WIZARD_STEP_TITLES,
} from "@/lib/constants";

export function WizardShell({
  currentStep,
  title,
  description,
  children,
}: {
  currentStep: number;
  title?: string;
  description: string;
  children: React.ReactNode;
}) {
  const currentStage = WIZARD_STAGES.find(
    (stage) => currentStep >= stage.from && currentStep <= stage.to
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
          ← العودة للرئيسية
        </Link>
        {currentStep > 1 ? (
          <Link
            href={`/wizard/${currentStep - 1}`}
            className="text-sm text-muted hover:text-accent"
          >
            الخطوة السابقة →
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1.5">
          {WIZARD_STAGES.map((stage) => {
            const isCurrent = stage.key === currentStage?.key;
            const isPast = currentStep > stage.to;
            return (
              <div
                key={stage.key}
                className={
                  "flex-1 min-w-[110px] rounded-lg border px-2.5 py-2 text-center text-xs transition " +
                  (isCurrent
                    ? "border-accent bg-accent-soft font-semibold text-accent"
                    : isPast
                      ? "border-border bg-surface-2 text-muted"
                      : "border-dashed border-border text-muted")
                }
              >
                {stage.label}
                <div className="font-mono text-[10px] opacity-70">
                  {stage.from}–{stage.to}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="font-mono text-xs text-muted">
          الخطوة {currentStep} من {TOTAL_WIZARD_STEPS}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink">
          {title ?? WIZARD_STEP_TITLES[currentStep]}
        </h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        {children}
      </div>
    </div>
  );
}
