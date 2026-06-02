import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Тег-кнопка для быстрого выбора (ТЗ: приметы, характер). */
export function TagToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-petal bg-blush text-petal-deep"
          : "border-blush bg-card text-ink-soft hover:border-petal/60 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
