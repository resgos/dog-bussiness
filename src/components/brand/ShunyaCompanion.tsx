"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { X } from "lucide-react";

const poses = [
  "/shunya/pose-wave.png",
  "/shunya/pose-happy.png",
  "/shunya/pose-surprised.png",
  "/shunya/pose-sneaky.png",
  "/shunya/pose-grumpy.png",
];

const playful = [
  "Гав-гав! 🐾",
  "Ты лучший сосед 🧡",
  "Почешешь за ушком?",
  "Я всегда на связи!",
  "Стая — это сила!",
];

function contextTip(path: string): string {
  if (path === "/")
    return "Гуляешь? Я слежу за районом — если что, подниму всех за 60 секунд!";
  if (path.startsWith("/auth")) return "Давай в стаю! Регистрация быстрая, обещаю.";
  if (path.startsWith("/profile/pets/add"))
    return "Покажи питомца со всех ракурсов — так его проще узнать!";
  if (path.startsWith("/profile/pets"))
    return "У каждого питомца есть QR-паспорт. Закажи адресник!";
  if (path.startsWith("/profile"))
    return "Загляни в достижения — ты ближе, чем думаешь!";
  if (path.startsWith("/sos"))
    return "Не паникуй — жми SOS, я мигом оповещу соседей.";
  if (path.startsWith("/map")) return "Видел похожую собаку? Поставь метку на карте!";
  if (path.startsWith("/feed")) return "Подпишись на объявление — пришлю обновления.";
  if (path.startsWith("/community"))
    return "Помогай искать — растёт твой рейтинг волонтёра!";
  if (path.startsWith("/shop"))
    return "Адресники ручной работы — и с моей мордочкой тоже есть!";
  if (path.startsWith("/p/"))
    return "Это публичный паспорт. Нашли? Свяжитесь с хозяином!";
  return "Я Шуня! Чем могу помочь?";
}

export function ShunyaCompanion() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [poseIdx, setPoseIdx] = useState(1);
  const [msgIdx, setMsgIdx] = useState(-1); // -1 → подсказка по контексту
  const [seen, setSeen] = useState(false);

  // Наклон к курсору — через motion value (без ре-рендеров).
  const tiltRaw = useMotionValue(0);
  const rotate = useSpring(tiltRaw, { stiffness: 150, damping: 15 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const rel = e.clientX / window.innerWidth - 0.5; // -0.5..0.5
      tiltRaw.set(Math.max(-12, Math.min(12, rel * 24)));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [tiltRaw]);

  const message = msgIdx < 0 ? contextTip(pathname) : playful[msgIdx % playful.length];

  const handleClick = () => {
    setSeen(true);
    setPoseIdx((i) => (i + 1) % poses.length);
    if (!open) {
      setOpen(true);
      setMsgIdx(-1);
    } else {
      setMsgIdx((i) => (i < 0 ? 0 : i + 1));
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-[15rem] rounded-2xl rounded-br-md border border-blush bg-card px-4 py-3 text-sm leading-snug text-ink shadow-soft"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
              className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-blush bg-card text-ink-soft transition-colors hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={handleClick}
        aria-label="Шуня — помощник"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative grid size-16 place-items-center rounded-full border-4 border-card bg-blush-soft shadow-lift ring-1 ring-blush transition-transform hover:scale-105 sm:size-20"
      >
        <motion.span style={{ rotate }} className="block size-full overflow-hidden rounded-full">
          <Image
            src={poses[poseIdx]}
            alt="Шуня"
            width={80}
            height={80}
            className="pointer-events-none size-full object-cover"
          />
        </motion.span>
        {!seen ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-lost opacity-70" />
            <span className="relative inline-flex size-3.5 rounded-full bg-status-lost" />
          </span>
        ) : null}
      </motion.button>
    </div>
  );
}
