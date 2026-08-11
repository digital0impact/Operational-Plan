export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft " +
        (props.className ?? "")
      }
    />
  );
}

export function SelectInput({
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      {...props}
      defaultValue={props.defaultValue ?? ""}
      className={
        "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft " +
        (props.className ?? "")
      }
    >
      <option value="" disabled>
        {placeholder ?? "اختر…"}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** مجموعة اختيار على شكل أزرار (مثل «نوع المدرسة» و«تصنيف المدرسة») */
export function ChoiceGroup({
  name,
  options,
  defaultValue,
  columns = 3,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <label key={option.value} className="group">
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={defaultValue === option.value}
            required
            className="peer sr-only"
          />
          <span className="flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-2 py-2.5 text-sm text-ink transition peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-semibold peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent-soft">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
      {message}
    </p>
  );
}
