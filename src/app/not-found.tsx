import { ArrowLeft, Compass, Search } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
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
            src="/shunya/sm/pose-surprised.png"
            message="Ой! Тут пусто. Идём домой — там теплее и пахнет вкусняшками."
          />
        </div>

        {/* Поиск прямо со страницы 404: потерявшийся посетитель сразу находит
            нужное, а не упирается в тупик. */}
        <form
          action="/search"
          method="get"
          className="mx-auto mt-8 flex max-w-md gap-2"
        >
          <Input
            name="q"
            placeholder="Искать собаку, породу, район…"
            aria-label="Поиск по платформе"
          />
          <Button type="submit" className="shrink-0">
            <Search className="size-4" aria-hidden />
            Найти
          </Button>
        </form>

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
