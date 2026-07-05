import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { SosButton } from "@/components/layout/SosButton";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-paw/60 via-blush to-petal/40 p-8 shadow-lift sm:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div className="flex flex-col items-start gap-5">
                <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
                  Готов вступить в стаю?
                </h2>
                <p className="max-w-lg text-lg leading-relaxed text-ink">
                  Зарегистрируй питомца сегодня — и весь район будет готов прийти
                  на помощь, если что-то случится. А пока — гуляй спокойно.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <ButtonLink href="/auth" variant="primary" size="lg">
                    Создать профиль
                    <ArrowRight className="size-5" aria-hidden />
                  </ButtonLink>
                  <SosButton size="lg" />
                </div>
              </div>

              <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-[2rem] border-4 border-card bg-card shadow-soft">
                <Image
                  src="/shunya/sm/pose-happy.png"
                  alt="Шуня ждёт тебя в стае"
                  fill
                  sizes="(max-width: 1024px) 80vw, 20rem"
                  className="object-contain p-4"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
