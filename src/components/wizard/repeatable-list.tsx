"use client";

import { useState } from "react";
import { AiSuggestButton } from "@/components/ai-suggest-button";
import type { AiResult } from "@/lib/ai/generate";

let counter = 0;
function nextKey() {
  counter += 1;
  return `row-${counter}-${Date.now().toString(36)}`;
}

export function RepeatableList({
  name,
  initialItems,
  placeholder,
  addLabel = "إضافة بند",
  aiSuggest,
}: {
  name: string;
  initialItems: string[];
  placeholder?: string;
  addLabel?: string;
  /** إن مُرِّرت، تُعرض فوق القائمة زر "اقترح بالذكاء الاصطناعي" يضيف بنودًا مقترحة كصفوف جديدة. */
  aiSuggest?: {
    label?: string;
    onGenerate: () => Promise<AiResult<{ items: string[] }>>;
  };
}) {
  const [rows, setRows] = useState(() =>
    initialItems.length > 0
      ? initialItems.map((value) => ({ key: nextKey(), value }))
      : [{ key: nextKey(), value: "" }]
  );

  function appendSuggested(items: string[]) {
    setRows((current) => {
      const nonEmpty = current.filter((row) => row.value.trim() !== "");
      const existing = new Set(nonEmpty.map((row) => row.value.trim()));
      const additions = items
        .filter((item) => !existing.has(item.trim()))
        .map((value) => ({ key: nextKey(), value }));
      return [...nonEmpty, ...additions];
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {aiSuggest ? (
        <AiSuggestButton
          label={aiSuggest.label}
          onGenerate={aiSuggest.onGenerate}
          onResult={(data) => appendSuggested(data.items)}
        />
      ) : null}
      {rows.map((row, index) => (
        <div key={row.key} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center font-mono text-xs text-muted">
            {index + 1}
          </span>
          <input
            name={name}
            defaultValue={row.value}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
          />
          <button
            type="button"
            onClick={() =>
              setRows((current) => current.filter((r) => r.key !== row.key))
            }
            className="shrink-0 rounded-lg border border-border px-2.5 py-2 text-xs text-muted transition hover:border-danger hover:text-danger"
            aria-label="حذف البند"
          >
            حذف
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setRows((current) => [...current, { key: nextKey(), value: "" }])
        }
        className="self-start rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-accent transition hover:border-accent"
      >
        + {addLabel}
      </button>
    </div>
  );
}
