import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const stats = [
  {
    value: "41%",
    text: "владельцев в России хотя бы раз теряли своего питомца",
    sourceLabel: "kaspersky.ru",
    sourceUrl:
      "https://www.kaspersky.ru/about/press-releases/pobeg-iz-kvartiry-41-vladelcev-domashnih-zhivotnyh-v-rossii-kak-minimum-odin-raz-teryali-svoego-pitomca",
  },
  {
    value: "168 000",
    text: "объявлений о пропаже и находке животных за 2024 год — на 17% больше, чем в 2023",
    sourceLabel: "tass.ru",
    sourceUrl: "https://tass.ru/obschestvo/23177323",
  },
  {
    value: "×3",
    text: "больше собак пропадает в январе — новогодние салюты вызывают панический страх",
    sourceLabel: "pet911.ru",
    sourceUrl: "https://pet911.ru/post/lost_found_pets_russia",
  },
  {
    value: "91%",
    text: "найденных собак обнаружены волонтёрами — их опыт и мониторинг ускоряют поиск",
    sourceLabel: "pet911.ru",
    sourceUrl: "https://pet911.ru/post/lost_found_pets_russia",
  },
];

export function Stats() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="📊 Почему это важно"
          title="Проблема, которую мы решаем"
          subtitle="Всё больше людей доверяют цифровым сервисам поиска питомцев — и волонтёрам, без которых поиск почти не работает."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.text} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-3xl border border-blush bg-gradient-to-br from-card to-blush-soft p-7 shadow-card">
                <p className="font-display text-5xl font-bold text-coral">
                  {s.value}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink">
                  {s.text}
                </p>
                <a
                  href={s.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-xs font-semibold text-ink-soft underline-offset-2 hover:text-petal-deep hover:underline"
                >
                  Источник: {s.sourceLabel}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
