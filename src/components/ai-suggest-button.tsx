"use client";

import { useState, useTransition } from "react";
import type { AiResult } from "@/lib/ai/generate";

/**
 * زر "اقترح بالذكاء الاصطناعي" عام — يستدعي Server Action، ثم يمرّر
 * الناتج إلى onResult ليملأه المكوّن المستدعي في الحقول المناسبة (عبر ref
 * إمبراطوري، بما يتوافق مع نمط الحقول غير المتحكَّم بها في بقية المعالج).
 * عند فشل التوليد (بما في ذلك عدم ضبط مفتاح الواجهة على الخادم) تُعرض
 * رسالة الخطأ العربية المُعادة من الخادم مباشرة تحت الزر.
 */
export function AiSuggestButton<T>({
  label = "اقترح بالذكاء الاصطناعي",
  pendingLabel = "جارٍ التوليد…",
  onGenerate,
  onResult,
}: {
  label?: string;
  pendingLabel?: string;
  onGenerate: () => Promise<AiResult<T>>;
  onResult: (data: T) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await onGenerate();
            if (result.ok) {
              onResult(result.data);
            } else {
              setError(result.error);
            }
          });
        }}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true">✨</span>
        {pending ? pendingLabel : label}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
