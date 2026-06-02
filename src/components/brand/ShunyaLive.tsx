"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const SRC = {
  happy: "/shunya/pose-happy-cut.png",
  wave: "/shunya/pose-wave-cut.png",
  surprised: "/shunya/pose-surprised-cut.png",
  sneaky: "/shunya/pose-sneaky-cut.png",
  grumpy: "/shunya/pose-grumpy-cut.png",
} as const;

export type ShunyaPose = keyof typeof SRC;

/**
 * Живая Шуня на основе реального арта: прозрачный маскот «дышит» и
 * покачивается (CSS), а смена позы делается кросс-фейдом между настоящими
 * кадрами. Никаких рисованных примитивов — это сам маскот.
 */
export function ShunyaLive({
  pose = "happy",
  size = 120,
  animated = true,
  className,
}: {
  pose?: ShunyaPose;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const [stack, setStack] = useState<{ id: number; pose: ShunyaPose }[]>([
    { id: 0, pose },
  ]);
  const idRef = useRef(0);

  useEffect(() => {
    setStack((prev) => {
      const top = prev[prev.length - 1];
      if (top && top.pose === pose) return prev;
      idRef.current += 1;
      return [...prev, { id: idRef.current, pose }].slice(-2);
    });
  }, [pose]);

  return (
    <div
      className={cn("relative", animated && "shunya-live", className)}
      style={{ width: size, height: size }}
    >
      {stack.map((layer, i) => {
        const isTop = i === stack.length - 1;
        return (
          <Image
            key={layer.id}
            src={SRC[layer.pose]}
            alt="Шуня"
            fill
            loading="eager"
            sizes={`${size}px`}
            className={cn(
              "object-contain opacity-100",
              isTop && layer.id !== 0 ? "shunya-fadein" : "",
            )}
          />
        );
      })}
    </div>
  );
}
