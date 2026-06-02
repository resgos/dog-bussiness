import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm font-bold text-petal-deep">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg",
            align === "center" ? "mx-auto" : "",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
