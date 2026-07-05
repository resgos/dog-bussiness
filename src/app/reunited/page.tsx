import Image from "next/image";
import Link from "next/link";
import { Heart, Clock, MapPin, PlusCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Истории спасения" };

export default async function ReunitedPage() {
  const items = await db.reunion.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <Badge tone="found">💞 Истории спасения</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Они вернулись домой
        </h1>
        <p className="mt-2 text-ink-soft">
          Каждая история — это собака, которую снова обнимают дома. Спасибо
          всем, кто не прошёл мимо. Расскажи и свою — пусть стая радуется вместе.
        </p>
        <div className="mt-5">
          <ButtonLink href="/reunited/new" size="lg">
            <PlusCircle className="size-5" aria-hidden />
            Рассказать свою историю
          </ButtonLink>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
          <ShunyaBubble
            src="/shunya/sm/pose-happy.png"
            message="Здесь будут истории счастливых возвращений. Стань первым — расскажи, как нашлась твоя собака!"
          />
          <div className="mt-6">
            <ButtonLink href="/reunited/new" size="lg">
              <PlusCircle className="size-5" aria-hidden />
              Рассказать свою историю
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const district = item.district
              ? findDistrict(item.district)?.name
              : null;

            return (
              <Reveal
                key={item.id}
                delay={Math.min(i, 8) * 0.06}
                className="h-full"
              >
                <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-blush bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
                  <div className="relative aspect-[4/3] bg-blush-soft">
                    {item.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photo}
                        alt={`${item.petName} снова дома`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Image
                          src="/shunya/sm/pose-happy.png"
                          alt="Шуня"
                          width={120}
                          height={120}
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="pointer-events-none absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-card/90 text-coral shadow-card">
                      <Heart className="size-5 fill-current" aria-hidden />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h2 className="text-lg font-bold text-ink">
                      {item.petName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                      {district ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-4 text-petal" aria-hidden />
                          {district}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-4 text-petal" aria-hidden />
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                      {item.story}
                    </p>
                  </div>

                  {/* Вся карточка кликабельна — ссылка-растяжка последней,
                      чтобы перекрыть relative-обёртку фото. */}
                  <Link
                    href={`/reunited/${item.id}`}
                    className="absolute inset-0 z-0"
                    aria-label={`Подробнее: ${item.petName} снова дома`}
                  >
                    <span className="sr-only">Подробнее</span>
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </Container>
  );
}
