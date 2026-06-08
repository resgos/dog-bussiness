import Link from "next/link";
import { ShieldAlert, Hand, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Что делать — гайды" };

export default function GuideHubPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header>
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">
            Гайды «Лапки»
          </h1>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Короткие проверенные планы на случай, когда каждая минута на счету.
            Выбери свою ситуацию — Шуня проведёт по шагам.
          </p>
        </header>

        <section className="mt-10 grid gap-5 sm:grid-cols-2">
          <Link
            href="/guide/lost"
            className="group flex flex-col rounded-3xl border border-blush bg-card p-6 shadow-card transition-all duration-200 hover:border-petal hover:shadow-lift"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-status-lost/15 text-status-lost">
              <ShieldAlert className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">
              🆘 Собака потерялась
            </h2>
            <p className="mt-2 leading-relaxed text-ink-soft">
              План первых 24 часов
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-petal-deep">
              Открыть план
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>

          <Link
            href="/guide/found"
            className="group flex flex-col rounded-3xl border border-blush bg-card p-6 shadow-card transition-all duration-200 hover:border-petal hover:shadow-lift"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-status-found/15 text-status-found-ink">
              <Hand className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">🐾 Нашли собаку</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">
              Как вернуть её домой
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-petal-deep">
              Открыть план
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
        </section>
      </div>
    </Container>
  );
}
