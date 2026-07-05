"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const SRC = {
  happy: "/shunya/sm/pose-happy.png",
  wave: "/shunya/sm/pose-wave.png",
  surprised: "/shunya/sm/pose-surprised.png",
  sneaky: "/shunya/sm/pose-sneaky.png",
  grumpy: "/shunya/sm/pose-grumpy.png",
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

  // После кросс-фейда нижний слой УДАЛЯЕТСЯ: кадры прозрачные, и старая поза
  // просвечивала сквозь новую («Шуня множится при наведении» — репорт).
  useEffect(() => {
    if (stack.length < 2) return;
    const t = setTimeout(() => setStack((prev) => prev.slice(-1)), 400);
    return () => clearTimeout(t);
  }, [stack]);

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
      {/* Предзагрузка всех поз: исходники тяжёлые (~1 МБ), и без прогрева смена
          позы мигала пустым кадром, пока грузился новый PNG. Скрытый слой
          заставляет Next выкачать все кадры сразу — кросс-фейд всегда мгновенный. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0">
        {Object.entries(SRC).map(([key, src]) => (
          <Image
            key={key}
            src={src}
            alt=""
            fill
            loading="eager"
            sizes={`${size}px`}
            className="object-contain"
          />
        ))}
      </div>
    </div>
  );
}
