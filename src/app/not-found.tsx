import { ArrowLeft, Compass } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";

export default function NotFound() {
  return (
    <Container className="py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-7xl font-bold text-petal-deep sm:text-8xl">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Кажется, эта тропинка потерялась
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-soft">
          Но мы умеем находить потеряшек! Давай вернёмся на знакомую дорожку.
        </p>

        <div className="mt-8 flex justify-center">
          <ShunyaBubble
            src="/shunya/pose-surprised.png"
            message="Ой! Тут пусто. Идём домой — там теплее и пахнет вкусняшками."
          />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="primary" size="lg">
            <ArrowLeft className="size-5" aria-hidden />
            На главную
          </ButtonLink>
          <ButtonLink href="/map" variant="secondary" size="lg">
            <Compass className="size-5" aria-hidden />
            На карту поиска
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
