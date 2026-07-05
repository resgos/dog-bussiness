import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Шуня с «репликой» — маскот ведёт пользователя по интерфейсу (ТЗ: Шуня
 * во всех ключевых сценариях). Используется в онбординге и на заглушках.
 */
export function ShunyaBubble({
  message,
  src = "/shunya/sm/pose-happy.png",
  size = 128,
  className,
  bubbleClassName,
}: {
  message: ReactNode;
  src?: string;
  size?: number;
  className?: string;
  bubbleClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 sm:gap-5", className)}>
      <div
        className="relative shrink-0 overflow-hidden rounded-3xl border-4 border-card bg-card shadow-soft ring-1 ring-blush"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt="Шуня"
          fill
          priority
          sizes={`${size}px`}
          className="object-contain p-1.5"
        />
      </div>
      <div
        className={cn(
          "relative max-w-md rounded-3xl rounded-bl-md border border-blush bg-card px-5 py-4 text-[0.97rem] leading-relaxed text-ink shadow-card",
          bubbleClassName,
        )}
      >
        {/* хвостик пузыря */}
        <span className="absolute -left-2 bottom-3 h-4 w-4 rotate-45 border-b border-l border-blush bg-card" />
        {message}
      </div>
    </div>
  );
}
