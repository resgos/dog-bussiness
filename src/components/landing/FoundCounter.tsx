"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Анимированный count-up. Стартует с 0 и на сервере, и на клиенте
 * (никакого рассинхрона гидрации), затем плавно набегает до target.
 */
export function FoundCounter({
  target = 47,
  duration = 1500,
  className,
}: {
  target?: number;
  duration?: number;
  className?: string;
}) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let raf = 0;
    let startTs = 0;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(Math.round(eased * target));
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
