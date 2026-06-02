"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Анимированный count-up. Стартует с 0 (одинаково на сервере и клиенте —
 * без рассинхрона гидрации), подтягивает реальное число с /api/found-today
 * и плавно набегает к нему от текущего значения.
 */
export function FoundCounter({
  fallback = 47,
  duration = 1500,
  className,
}: {
  fallback?: number;
  duration?: number;
  className?: string;
}) {
  const [value, setValue] = useState(0);
  const [target, setTarget] = useState(fallback);
  const valueRef = useRef(0);

  // Реальное значение с сервера.
  useEffect(() => {
    let alive = true;
    fetch("/api/found-today")
      .then((r) => r.json())
      .then((d) => {
        if (alive && typeof d?.count === "number") setTarget(d.count);
      })
      .catch(() => {
        /* оставляем fallback */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Плавная анимация от текущего значения к target.
  useEffect(() => {
    const from = valueRef.current;
    let raf = 0;
    let startTs = 0;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const v = Math.round(from + (target - from) * eased);
      valueRef.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return (
    <span className={className} suppressHydrationWarning>
      {value}
    </span>
  );
}
