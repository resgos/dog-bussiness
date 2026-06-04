import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Зелёная плашка успеха с галочкой.
 * variant: "pill" — компактный бейдж (по умолчанию), "block" — сообщение в форме.
 */
export function SuccessNote({
  children,
  variant = "pill",
  className,
}: {
  children: ReactNode;
  variant?: "pill" | "block";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 bg-status-found/15 px-4 text-sm font-bold text-status-found-ink",
        variant === "block" ? "rounded-2xl py-3" : "rounded-full py-2",
        className,
      )}
    >
      <Check className="size-4" aria-hidden />
      {children}
    </p>
  );
}
