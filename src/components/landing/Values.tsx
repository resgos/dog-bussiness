import { HeartHandshake, Zap, ShieldCheck, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

const values = [
  {
    icon: HeartHandshake,
    title: "Взаимовыручка",
    text: "Собачники одного района — это стая. Свои помогают своим, без вопросов и за секунды.",
  },
  {
    icon: Zap,
    title: "Скорость",
    text: "Каждая минута на счету. Всё в приложении заточено на мгновенную реакцию.",
  },
  {
    icon: ShieldCheck,
    title: "Забота",
    text: "Адресник на каждом ошейнике, актуальный профиль питомца, подготовка к рискам заранее.",
  },
  {
    icon: MapPin,
    title: "Локальность",
    text: "Мы знаем каждый двор, площадку и чат района. Такой плотности отклика нет у глобальных платформ.",
  },
];

export function Values() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="🧡 Ценности бренда"
          title="Здесь безопасно, здесь заботятся, здесь помогут"
          subtitle="Гамма и атмосфера сервиса создают эффект «объятий» — мы не паникуем, а мягко успокаиваем и вселяем надежду."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.08}>
              <Card interactive className="h-full">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-blush text-petal-deep">
                  <v.icon className="size-6" aria-hidden />
                </div>
                <h3 className="text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {v.text}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
