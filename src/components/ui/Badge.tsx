import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "petal" | "paw" | "lost" | "found" | "seen";

const tones: Record<Tone, string> = {
  neutral: "bg-blush-soft text-ink-soft",
  petal: "bg-blush text-petal-deep",
  paw: "bg-paw/40 text-ink",
  lost: "bg-status-lost/15 text-status-lost",
  found: "bg-status-found/15 text-status-found-ink",
  seen: "bg-status-seen/15 text-status-seen-ink",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
