"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Кнопка «Наверх»: появляется после прокрутки на длинных страницах (лента, хаб
 * района, гайды). Слева внизу — чтобы не наложиться на компаньона Шуню справа.
 * Уважает «меньше движения»: при включённой настройке скролл мгновенный.
 * Всегда в DOM (скрыта классами) — так доступна для регресс-сторожа.
 */
export function ScrollToTop() {
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
      }
      aria-label="Наверх"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={cn(
        "fixed bottom-4 left-4 z-40 grid size-12 place-items-center rounded-full border border-blush bg-card text-petal-deep shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-petal hover:shadow-lift sm:bottom-6 sm:left-6",
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
