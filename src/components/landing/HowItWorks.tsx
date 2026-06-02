import { PawPrint, Siren, BellRing } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const steps = [
  {
    icon: PawPrint,
    title: "Добавь питомца в стаю",
    text: "Фото, кличка, порода, особые приметы и районы прогулок. Получишь цифровой паспорт с QR-кодом.",
  },
  {
    icon: Siren,
    title: "Если потерялась — жми SOS",
    text: "Отметь точку и время пропажи, выбери радиус оповещения: 1 / 3 / 5 / 10 км.",
  },
  {
    icon: BellRing,
    title: "Район поднимается за 60 секунд",
    text: "Push соседям в радиусе, публикация в районной ленте и дублирование в Telegram-чаты района.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-blush-soft/50 py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="🐾 Как это работает"
          title="Три шага — и весь район ищет вместе с тобой"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <div className="relative h-full rounded-3xl border border-blush bg-card p-7 shadow-card">
                <span className="absolute right-6 top-6 font-display text-5xl font-bold text-blush">
                  {i + 1}
                </span>
                <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-paw/50 text-ink">
                  <s.icon className="size-7" aria-hidden />
                </div>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
