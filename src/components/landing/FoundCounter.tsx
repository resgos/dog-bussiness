"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Анимированный count-up для счётчика на hero.
 * Стартует с 0 (одинаково на сервере и клиенте — без рассинхрона гидрации),
 * один раз плавно набегает к реальному числу с /api/found-today.
 * Если сегодня ещё 0 находок — показываем накопительный итог (никогда не «0»),
 * переключая подпись с todayLabel на totalLabel.
 */
export function FoundCounter({
  fallback = 240,
  duration = 1500,
  todayLabel = "собак найдено сегодня",
  totalLabel = "собак уже дома",
}: {
  fallback?: number;
  duration?: number;
  todayLabel?: string;
  totalLabel?: string;
}) {
  const [value, setValue] = useState(0);
  const [target, setTarget] = useState(0);
  const [label, setLabel] = useState(todayLabel);
  const valueRef = useRef(0);

  // Реальные числа с сервера: сегодня + накопительно.
  useEffect(() => {
    let alive = true;
    fetch("/api/found-today")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const today = typeof d?.count === "number" ? d.count : 0;
        const total = typeof d?.total === "number" ? d.total : 0;
        if (today > 0) {
          setTarget(today);
          setLabel(todayLabel);
        } else if (total > 0) {
          setTarget(total);
          setLabel(totalLabel);
        } else {
          setTarget(fallback);
          setLabel(totalLabel);
        }
      })
      .catch(() => {
        setTarget(fallback);
        setLabel(totalLabel);
      });
    return () => {
      alive = false;
    };
  }, [fallback, todayLabel, totalLabel]);

  // Плавная анимация от текущего значения к target (только вверх — цель ≥ 0).
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
    <span suppressHydrationWarning>
      {value} {label}
    </span>
  );
}
