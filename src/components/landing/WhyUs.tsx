import { Check, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const rows = [
  {
    param: "Фокус",
    others: "Вся Россия / весь мир",
    us: "Москва, район за районом",
  },
  {
    param: "Скорость оповещения",
    others: "Доска объявлений",
    us: "Push всем соседям за 5 секунд",
  },
  {
    param: "Комьюнити",
    others: "Нет",
    us: "Районные ленты, рейтинг волонтёров",
  },
  {
    param: "Мерч и адресники",
    others: "Нет",
    us: "Встроенный магазин ручной работы",
  },
  {
    param: "Telegram-интеграция",
    others: "Минимальная",
    us: "Бот в каждом районном чате",
  },
  {
    param: "Маскот и эмоция",
    others: "Нет",
    us: "Шуня — узнаваемый персонаж",
  },
];

export function WhyUs() {
  return (
    <section className="bg-blush-soft/50 py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="✨ Чем мы отличаемся"
          title="Не доска объявлений, а живая стая района"
        />

        <Reveal className="mx-auto mt-12 max-w-4xl">
          <div className="overflow-hidden rounded-3xl border border-blush bg-card shadow-card">
            {/* шапка */}
            <div className="grid grid-cols-[1fr_1fr] gap-px bg-blush sm:grid-cols-[1.2fr_1fr_1.3fr]">
              <div className="hidden bg-card px-5 py-4 text-sm font-bold uppercase tracking-wide text-ink-soft sm:block">
                Параметр
              </div>
              <div className="bg-card px-5 py-4 text-center text-sm font-bold text-ink-soft">
                Другие сервисы
              </div>
              <div className="bg-paw/40 px-5 py-4 text-center text-sm font-bold text-ink">
                Лапка помощи
              </div>
            </div>

            {/* строки */}
            {rows.map((r) => (
              <div
                key={r.param}
                className="grid grid-cols-[1fr_1fr] gap-px border-t border-blush bg-blush sm:grid-cols-[1.2fr_1fr_1.3fr]"
              >
                <div className="col-span-2 bg-card px-5 pt-4 text-sm font-bold text-ink sm:col-span-1 sm:py-4">
                  {r.param}
                </div>
                <div className="flex items-start gap-2 bg-card px-5 py-4 text-sm text-ink-soft">
                  <X
                    className="mt-0.5 size-4 shrink-0 text-status-lost/70"
                    aria-hidden
                  />
                  {r.others}
                </div>
                <div className="flex items-start gap-2 bg-paw/15 px-5 py-4 text-sm font-medium text-ink">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-status-found"
                    aria-hidden
                  />
                  {r.us}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
