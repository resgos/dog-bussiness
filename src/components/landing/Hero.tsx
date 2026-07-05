"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, PawPrint } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SosButton } from "@/components/layout/SosButton";
import { Container } from "@/components/ui/Container";
import { FoundCounter } from "./FoundCounter";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* мягкие блобы фона */}
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-blush blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-32 size-80 rounded-full bg-paw/40 blur-3xl" />

      <Container className="relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        {/* Текст (всегда видим — без зависимости от JS-анимации) */}
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm font-bold text-petal-deep">
            <PawPrint className="size-4" aria-hidden />
            Москва · район за районом
          </span>

          <h1 className="text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
            Поднимем весь район{" "}
            <span className="text-petal-deep">за&nbsp;60&nbsp;секунд</span>, если
            собака потерялась
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            «Лапка помощи» объединяет собачников Москвы в стаю взаимопомощи. Сосед —
            потенциальный спасатель, а технологии сокращают путь питомца домой с
            недель до часов.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/profile/pets/add" variant="primary" size="lg">
              Добавить питомца
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
            <SosButton size="lg" variant="sos-outline" />
          </div>

          {/* Живой счётчик */}
          <div className="mt-2 flex items-center gap-4 rounded-3xl border border-blush bg-card/70 px-5 py-4 shadow-card backdrop-blur">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-found opacity-70" />
              <span className="relative inline-flex size-3 rounded-full bg-status-found" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none text-ink">
                <FoundCounter
                  todayLabel="собак найдено сегодня"
                  totalLabel="собак уже дома"
                />
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                вместе со «стаей» своего района
              </p>
            </div>
          </div>
        </div>

        {/* Иллюстрация */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="relative aspect-square overflow-hidden rounded-[2.75rem] border-4 border-card bg-card shadow-lift">
            <Image
              src="/shunya/sm/pose-happy.png"
              alt="Шуня — маскот «Лапки помощи»"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 28rem"
              className="object-contain p-6"
            />
          </div>

          {/* плавающая подпись */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-4 -left-4 rounded-2xl border border-blush bg-card px-4 py-2.5 shadow-soft"
          >
            <p className="text-sm font-bold text-ink">🐾 Шуня на связи</p>
            <p className="text-xs text-ink-soft">подниму район, если что</p>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
