import Image from "next/image";
import Link from "next/link";
import type { Reunion } from "@prisma/client";
import { Heart, ArrowRight, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { timeAgo, plural } from "@/lib/format";
import { findDistrict } from "@/lib/districts";

/** Район может храниться как id ("khamovniki") или уже как название — резолвим мягко. */
function districtLabel(value: string | null): string | null {
  if (!value) return null;
  return findDistrict(value)?.name ?? value;
}

/**
 * Тизер историй воссоединения на главной: счётчик «вернулись домой» + до 3 превью.
 * Серверный компонент — читает БД напрямую. Если историй ещё нет — добрый призыв.
 */
export async function ReunionsTeaser() {
  // Главная — лицо продукта: даже при недоступности БД она должна отрисоваться
  // целиком. При сбое запроса мягко деградируем до пустого тизера, не роняя страницу.
  let count = 0;
  let recent: Reunion[] = [];
  try {
    [count, recent] = await Promise.all([
      db.reunion.count(),
      db.reunion.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    ]);
  } catch {
    count = 0;
    recent = [];
  }

  // ——— Пусто: мягкий тизер вместо «достижения» с нулём ———
  if (count === 0) {
    return (
      <section className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <div className="grid items-center gap-8 rounded-[2.5rem] border border-blush bg-gradient-to-br from-blush-soft to-card p-8 shadow-card sm:p-12 lg:grid-cols-[1fr_auto]">
              <div className="flex flex-col items-start gap-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm font-bold text-petal-deep">
                  <Sparkles className="size-4" aria-hidden />
                  Истории стаи
                </span>
                <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                  Здесь будут истории счастливых возвращений 💞
                </h2>
                <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
                  Пока ни одна история не написана — но мы верим, что скоро
                  появится первая. Нашли свою собаку с помощью стаи? Расскажите,
                  как это было, и подарите надежду другим.
                </p>
                <ButtonLink href="/reunited" variant="secondary" size="lg">
                  Истории воссоединения
                  <ArrowRight className="size-5" aria-hidden />
                </ButtonLink>
              </div>

              <div className="relative mx-auto aspect-square w-full max-w-[14rem] overflow-hidden rounded-[2rem] border-4 border-card bg-card shadow-soft">
                <Image
                  src="/shunya/pose-happy-cut.png"
                  alt="Шуня ждёт первую историю возвращения"
                  fill
                  sizes="(max-width: 1024px) 60vw, 14rem"
                  className="object-contain p-4"
                />
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    );
  }

  // ——— Есть истории: счётчик + до 3 превью ———
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm font-bold text-petal-deep">
              <Heart className="size-4 fill-current" aria-hidden />
              Истории воссоединения
            </span>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Они вернулись домой 💞
            </h2>
            <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
              <span className="font-display text-5xl font-bold leading-none text-coral sm:text-6xl">
                {count}
              </span>
              <span className="text-base leading-relaxed text-ink-soft sm:text-lg">
                {plural(count, "собака вернулась", "собаки вернулись", "собак вернулись")}{" "}
                домой по историям стаи
              </span>
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((r, i) => {
            const place = districtLabel(r.district);
            return (
              <Reveal key={r.id} delay={i * 0.08}>
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-blush bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-blush-soft">
                    {r.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.photo}
                        alt={`${r.petName} снова дома`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Image
                        src="/shunya/pose-happy-cut.png"
                        alt={`${r.petName} снова дома`}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22rem"
                        className="object-contain p-6"
                      />
                    )}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-status-found/95 px-3 py-1 text-xs font-bold text-white shadow-card">
                      <Heart className="size-3.5 fill-current" aria-hidden />
                      Дома
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-lg font-bold text-ink">{r.petName}</h3>
                      <span className="shrink-0 text-xs text-ink-soft">
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>
                    {place ? (
                      <p className="text-sm font-semibold text-petal-deep">
                        {place}
                      </p>
                    ) : null}
                    <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">
                      {r.story}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/reunited" variant="secondary" size="lg">
              Все истории
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
