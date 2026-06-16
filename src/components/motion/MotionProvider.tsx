"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Глобально подчиняет ВСЕ framer-motion анимации системной настройке
 * «уменьшить движение» (reducedMotion="user"): hero, плавающая Шуня, Reveal и
 * пр. перестают двигаться, если пользователь так выбрал. CSS-анимации покрыты
 * media-запросом в globals.css. children остаются серверными (передаются пропом).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
