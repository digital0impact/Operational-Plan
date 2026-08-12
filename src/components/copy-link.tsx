"use client";

import { useEffect, useRef, useState } from "react";

export function CopyLink({ path, label }: { path: string; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // نملأ الرابط الكامل بعد الوصول للعميل مباشرة على عنصر الـ DOM (بلا حالة React)
  // لتفادي أي تعارض بين تصيير الخادم والعميل.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = `${window.location.origin}${path}`;
    }
  }, [path]);

  async function handleCopy() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          readOnly
          defaultValue={path}
          dir="ltr"
          className="w-full truncate rounded-lg border border-border bg-surface-2 px-3 py-2 text-left font-mono text-xs text-muted outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
        >
          {copied ? "تم النسخ ✓" : "نسخ"}
        </button>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
        >
          فتح
        </a>
      </div>
    </div>
  );
}
