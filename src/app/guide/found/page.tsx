import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Hand,
  QrCode,
  ShieldCheck,
  Search,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";

export const metadata = { title: "Нашли собаку — что делать" };

type Step = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const STEPS: Step[] = [
  {
    icon: Hand,
    title: "Безопасно подойди",
    text: "Не делай резких движений, присядь боком, предложи воду и еду. Незнакомая испуганная собака может укусить — действуй спокойно.",
  },
  {
    icon: QrCode,
    title: "Проверь адресник и QR",
    text: "На ошейнике может быть жетон с телефоном или QR-паспорт «Лапки». Наведи камеру телефона на QR — откроется страница с контактами хозяина.",
  },
  {
    icon: ShieldCheck,
    title: "Сканируй чип в ветклинике",
    text: "Это бесплатно и часто сразу даёт владельца. Номер чипа также можно проверить на странице «Проверить чип».",
  },
  {
    icon: Search,
    title: "Опубликуй находку",
    text: "Добавь объявление в «Лапке» и посмотри ленту «Потерялись»: возможно, собаку уже ищут рядом.",
  },
  {
    icon: Phone,
    title: "Сообщи в приюты и клиники района",
    text: "Оставь приметы и свои контакты: владелец часто обзванивает именно их.",
  },
  {
    icon: ShieldAlert,
    title: "Убедись, что отдаёшь настоящему хозяину",
    text: "Попроси показать фото собаки, назвать особые приметы или номер чипа. Это защищает собаку.",
  },
];

export default function GuideFoundPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header>
          <Badge tone="found">🐾 Спасибо, что помогаешь</Badge>
          <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            Нашли собаку? Вот как вернуть её домой
          </h1>
        </header>

        <ShunyaBubble
          src="/shunya/pose-surprised.png"
          message="Спасибо, что не прошёл мимо! Идём по шагам — вместе вернём собаку хозяину."
          className="mt-8"
        />

        <section className="mt-10">
          <ol className="space-y-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="rounded-3xl border border-blush bg-card p-5 shadow-card sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blush-soft text-base font-bold text-petal-deep">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-petal-deep">
                        <Icon className="size-5 shrink-0" aria-hidden />
                        <h2 className="text-lg font-bold text-ink">
                          {step.title}
                        </h2>
                      </div>
                      <p className="mt-2 leading-relaxed text-ink-soft">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mt-10 rounded-3xl bg-blush-soft p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">Помоги собаке вернуться домой</h2>
          <p className="mt-2 leading-relaxed text-ink-soft">
            Опубликуй находку и проверь чип — так хозяин найдётся быстрее всего.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/found/new" size="lg">
              Опубликовать находку
            </ButtonLink>
            <ButtonLink href="/chip" variant="secondary" size="lg">
              Проверить чип
            </ButtonLink>
          </div>
          <p className="mt-5 text-sm">
            <Link
              href="/guide/lost"
              className="font-semibold text-petal-deep hover:underline"
            >
              У меня, наоборот, пропала собака →
            </Link>
          </p>
        </section>
      </div>
    </Container>
  );
}
