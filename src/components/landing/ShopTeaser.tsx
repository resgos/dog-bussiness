import Image from "next/image";
import { ScanLine, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";

export function ShopTeaser() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <div className="grid items-center gap-10 rounded-[2.5rem] border border-blush bg-gradient-to-br from-blush-soft to-card p-8 shadow-soft sm:p-12 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-5">
              <Badge tone="petal">🏷️ Магазин</Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Адресник с QR-кодом: сканируешь&nbsp;→ сразу контакты хозяина
              </h2>
              <p className="text-lg leading-relaxed text-ink-soft">
                Кастомные адресники ручной работы, браслеты, брелоки и мерч с
                Шуней. Каждый QR ведёт на публичный паспорт питомца с фото,
                кличкой и контактами для связи.
              </p>
              <ButtonLink href="/shop" variant="primary" size="lg">
                В магазин
                <ArrowRight className="size-5" aria-hidden />
              </ButtonLink>
            </div>

            {/* Реальное фото мерча */}
            <div className="mx-auto w-full max-w-sm">
              <div className="relative aspect-square overflow-hidden rounded-[2rem] border-4 border-card shadow-lift">
                <Image
                  src="/shop/merch-tags.png"
                  alt="Адресники-косточки и браслеты с гравировкой «Шуня»"
                  fill
                  sizes="(max-width: 1024px) 80vw, 24rem"
                  className="object-cover"
                />
                <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-2xl bg-card/90 px-4 py-2.5 shadow-card backdrop-blur">
                  <ScanLine className="size-5 shrink-0 text-petal" aria-hidden />
                  <span className="text-sm font-semibold text-ink">
                    Наведи камеру — увидишь контакты
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
