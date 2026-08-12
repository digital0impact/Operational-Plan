"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { saveDetailStepAction } from "@/app/actions/wizard";
import { suggestActionItemAction } from "@/app/actions/ai";
import type { ActionState } from "@/app/actions/auth";
import { ErrorNotice } from "@/components/form-controls";
import { SubmitButton } from "@/components/submit-button";
import { AiSuggestButton } from "@/components/ai-suggest-button";
import { INITIATIVE_TYPES } from "@/lib/constants";

/**
 * رفع صورة شاهد اختيارية (صورة عادية أو صورة باركود/QR يرفعها مدير
 * المدرسة بنفسه) لمبادرة/برنامج واحد. يعرض معاينة للصورة الحالية أو
 * المُختارة حديثًا، وزر إزالة يُرسل علامة حذف صريحة مع النموذج.
 */
function EvidenceImageField({
  id,
  existingUrl,
}: {
  id: string;
  existingUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(existingUrl);
  const [removed, setRemoved] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <span className="text-xs font-semibold text-muted">
        صورة الشاهد (صورة عادية أو صورة باركود/QR) — اختياري، JPG أو PNG أو
        WEBP بحد أقصى 2 ميجابايت
      </span>

      {preview && !removed ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- معاينة محلية base64/blob، لا فائدة من next/image هنا */}
          <img
            src={preview}
            alt="معاينة صورة الشاهد"
            className="h-20 w-20 rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setRemoved(true);
            }}
            className="text-xs text-muted hover:text-danger"
          >
            إزالة الصورة
          </button>
        </div>
      ) : null}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        name={`evidenceImage_${id}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPreview(URL.createObjectURL(file));
          setRemoved(false);
        }}
        className="w-full rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-xs text-muted file:ms-2 file:rounded-md file:border-0 file:bg-accent-soft file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-accent"
      />
      {removed ? (
        <input type="hidden" name={`removeEvidenceImage_${id}`} value="on" />
      ) : null}
    </div>
  );
}

type DetailFieldRefs = {
  activity: HTMLTextAreaElement | null;
  targetCategory: HTMLInputElement | null;
  executionRequirements: HTMLInputElement | null;
  executionDate: HTMLInputElement | null;
  responsible: HTMLInputElement | null;
  evidence: HTMLInputElement | null;
};

const initialState: ActionState = { error: null };

type InitiativeRow = {
  id: string;
  type: string;
  name: string;
  activity: string;
  targetCategory: string;
  executionRequirements: string;
  executionDate: string;
  responsible: string;
  evidence: string;
  evidenceImageUrl: string | null;
};

export function DetailStepForm({
  step,
  initiatives,
}: {
  step: number;
  initiatives: InitiativeRow[];
}) {
  const action = saveDetailStepAction.bind(null, step);
  const [state, formAction] = useActionState(action, initialState);
  const fieldRefs = useRef<Record<string, DetailFieldRefs>>({});

  if (initiatives.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-muted">
          لم تُضف مبادرات أو برامج لهذا الهدف بعد. أضفها أولًا في خطوتَي
          المبادرات والبرامج قبل تعبئة جدول التنفيذ.
        </p>
        <div className="flex gap-2">
          <Link
            href="/wizard/14"
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-ink hover:border-accent"
          >
            الذهاب إلى المبادرات
          </Link>
          <Link
            href="/wizard/15"
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-ink hover:border-accent"
          >
            الذهاب إلى البرامج
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {initiatives.map((initiative) => (
        <div
          key={initiative.id}
          className="rounded-lg border border-border bg-surface-2 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-ink">
              <span className="ms-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                {INITIATIVE_TYPES[initiative.type as "INITIATIVE" | "PROGRAM"]
                  ?.label ?? initiative.type}
              </span>{" "}
              {initiative.name}
            </p>
            <AiSuggestButton
              label="اقترح خطة التنفيذ بالذكاء الاصطناعي"
              onGenerate={() => suggestActionItemAction(initiative.id)}
              onResult={(data) => {
                const refs = fieldRefs.current[initiative.id];
                if (!refs) return;
                if (refs.activity) refs.activity.value = data.activity;
                if (refs.targetCategory)
                  refs.targetCategory.value = data.targetCategory;
                if (refs.executionRequirements)
                  refs.executionRequirements.value = data.executionRequirements;
                if (refs.executionDate)
                  refs.executionDate.value = data.executionDate;
                if (refs.responsible) refs.responsible.value = data.responsible;
                if (refs.evidence) refs.evidence.value = data.evidence;
              }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-semibold text-muted">الأنشطة</span>
              <textarea
                ref={(el) => {
                  (fieldRefs.current[initiative.id] ??= {} as DetailFieldRefs).activity = el;
                }}
                name={`activity_${initiative.id}`}
                defaultValue={initiative.activity}
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">
                الفئة المستهدفة
              </span>
              <input
                ref={(el) => {
                  (fieldRefs.current[initiative.id] ??= {} as DetailFieldRefs).targetCategory = el;
                }}
                name={`category_${initiative.id}`}
                defaultValue={initiative.targetCategory}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">
                متطلبات التنفيذ
              </span>
              <input
                ref={(el) => {
                  (fieldRefs.current[initiative.id] ??= {} as DetailFieldRefs).executionRequirements = el;
                }}
                name={`requirements_${initiative.id}`}
                defaultValue={initiative.executionRequirements}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">
                تاريخ التنفيذ
              </span>
              <input
                ref={(el) => {
                  (fieldRefs.current[initiative.id] ??= {} as DetailFieldRefs).executionDate = el;
                }}
                name={`date_${initiative.id}`}
                defaultValue={initiative.executionDate}
                placeholder="مثال: الفصل الدراسي الأول"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">
                التنفيذ والمسؤولية
              </span>
              <input
                ref={(el) => {
                  (fieldRefs.current[initiative.id] ??= {} as DetailFieldRefs).responsible = el;
                }}
                name={`responsible_${initiative.id}`}
                defaultValue={initiative.responsible}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-semibold text-muted">الشواهد</span>
              <input
                ref={(el) => {
                  (fieldRefs.current[initiative.id] ??= {} as DetailFieldRefs).evidence = el;
                }}
                name={`evidence_${initiative.id}`}
                defaultValue={initiative.evidence}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <EvidenceImageField
              id={initiative.id}
              existingUrl={initiative.evidenceImageUrl}
            />
          </div>
        </div>
      ))}

      <ErrorNotice message={state.error} />

      <SubmitButton pendingLabel="جارٍ الحفظ…">
        {step === 25 ? "حفظ وإنهاء الخطة ←" : "حفظ ومتابعة إلى الهدف التالي ←"}
      </SubmitButton>
    </form>
  );
}
