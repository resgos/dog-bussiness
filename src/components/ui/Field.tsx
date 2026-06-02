import type {
  ComponentProps,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-2xl border border-blush bg-card px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-petal focus:ring-4 focus:ring-blush";

/** Обёртка поля: подпись + обязательность + подсказка (label оборачивает контрол). */
export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
          {required ? <span className="text-status-lost"> *</span> : null}
        </span>
      ) : null}
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-ink-soft">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(fieldBase, "min-h-24 resize-y", className)} {...props} />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "appearance-none pr-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border border-blush bg-card p-3.5 transition-colors hover:border-petal/60",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 accent-petal-deep"
        {...props}
      />
      <span className="text-sm leading-snug text-ink">{label}</span>
    </label>
  );
}
