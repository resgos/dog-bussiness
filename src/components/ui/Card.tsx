import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  /** Чуть приподнимать карточку при наведении. */
  interactive?: boolean;
};

export function Card({
  as: Tag = "div",
  className,
  children,
  interactive = false,
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-3xl border border-blush bg-card p-6 shadow-card",
        interactive &&
          "transition-all duration-200 hover:-translate-y-1 hover:shadow-soft",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
