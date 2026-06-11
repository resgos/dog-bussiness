import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Тизер «Пульс спасения» на главной: три живые цифры + переход на /pulse.
 * Серверный компонент. При сбое БД мягко деградирует (главная не падает).
 */
export async function PulseTeaser() {
  let activeLost = 0;
  let reunions = 0;
  let sightingsWeek = 0;
  try {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    [activeLost, reunions, sightingsWeek] = await Promise.all([
      db.lostReport.count({ where: { status: "active" } }),
      db.reunion.count(),
      db.sighting.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);
  } catch {
    /* мягкая деградация */
  }

  const items = [
    { value: activeLost, label: "в розыске сейчас" },
    { value: reunions, label: "уже дома" },
    { value: sightingsWeek, label: "наблюдений за неделю" },
  ];

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <Reveal>
          <Link
            href="/pulse"
            className="group block rounded-[2.5rem] border border-blush bg-gradient-to-br from-card to-blush-soft p-8 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft sm:p-10"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm font-bold text-petal-deep">
                  <Activity className="size-4" aria-hidden /> Пульс спасения
                </span>
                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                  Стая работает прямо сейчас
                </h2>
                <p className="mt-1 inline-flex items-center gap-1.5 font-semibold text-petal-deep">
                  Смотреть живой пульс города
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                {items.map((it) => (
                  <div key={it.label} className="text-center">
                    <div className="font-display text-3xl font-bold leading-none text-coral sm:text-4xl">
                      {it.value.toLocaleString("ru-RU")}
                    </div>
                    <div className="mt-1 text-xs leading-snug text-ink-soft sm:text-sm">
                      {it.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
