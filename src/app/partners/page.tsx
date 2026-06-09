import { ArrowRight, Building2, Send, Star, Store } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";

export const metadata = { title: "Для партнёров" };

// Кому полезен каталог «Сервисы рядом».
const audience = [
  { icon: Building2, label: "Ветклиники" },
  { icon: Store, label: "Груминг-салоны" },
  { icon: Store, label: "Передержка и гостиницы" },
  { icon: Store, label: "Кинологи" },
  { icon: Store, label: "Зоомагазины" },
];

// Что даёт размещение.
const benefits = [
  {
    title: "Вовлечённая аудитория",
    text: "Хозяева собак открывают «Лапку» каждый день — гуляют, ищут, заботятся о питомцах. Вы попадаете прямо к ним.",
  },
  {
    title: "Точно по району",
    text: "Каталог фильтруется по районам Москвы — вас находят соседи, которым удобно дойти именно до вас.",
  },
  {
    title: "Доверие сообщества",
    text: "Карточка в проверенном каталоге работает как рекомендация от своих, а не обезличенная реклама.",
  },
];

export default function PartnersPage() {
  return (
    <Container className="py-12 sm:py-16">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <Badge tone="paw">
          <Store className="size-3.5" aria-hidden />
          Партнёрам
        </Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Прямой доступ к собачникам вашего района
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-ink-soft">
          Питомники, ветклиники, груминг, передержка и зоомагазины — разместите
          сервис в каталоге «Сервисы рядом» и приходите к самой вовлечённой
          аудитории владельцев собак Москвы через приложение, которое открывают
          каждый день.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/partners/new" size="lg">
            <Send className="size-5" aria-hidden />
            Подать заявку
          </ButtonLink>
          <ButtonLink href="/services" variant="secondary" size="lg">
            Посмотреть каталог
            <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </div>
      </div>

      {/* Аудитория */}
      <div className="mt-12 flex flex-wrap justify-center gap-2.5">
        {audience.map((a) => (
          <span
            key={a.label}
            className="inline-flex items-center gap-2 rounded-full border border-blush bg-card px-4 py-2 text-sm font-semibold text-ink shadow-card"
          >
            <a.icon className="size-4 text-petal" aria-hidden />
            {a.label}
          </span>
        ))}
      </div>

      {/* Преимущества */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="rounded-3xl border border-blush bg-card p-6 shadow-card"
          >
            <h3 className="text-lg font-bold text-ink">{b.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b.text}</p>
          </div>
        ))}
      </div>

      {/* Тарифы */}
      <div className="mt-12">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Простые тарифы
        </h2>
        <div className="mx-auto mt-6 grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* Бесплатная заявка */}
          <div className="flex flex-col rounded-3xl border border-blush bg-card p-6 shadow-card">
            <Badge tone="neutral">Базовый</Badge>
            <p className="mt-3 text-3xl font-bold text-ink">
              Бесплатно
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Заявка на размещение в каталоге
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              <li>• Карточка сервиса в «Сервисы рядом»</li>
              <li>• Фильтрация по типу и району</li>
              <li>• Контакты, адрес и ссылка на сайт</li>
            </ul>
          </div>

          {/* Промо */}
          <div className="flex flex-col rounded-3xl border-2 border-paw bg-card p-6 shadow-card ring-1 ring-paw/40">
            <Badge tone="paw" className="font-bold">
              <Star className="size-3.5 fill-current" aria-hidden />
              Промо
            </Badge>
            <p className="mt-3 text-3xl font-bold text-ink">
              990 ₽<span className="text-base font-semibold text-ink-soft">/мес</span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Featured-размещение в топе каталога
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              <li>• Закрепление в топе «Сервисов рядом»</li>
              <li>• Бейдж «⭐ Рекомендуем» на карточке</li>
              <li>• Заметнее для соседей вашего района</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Финальный CTA */}
      <div className="mt-12">
        <div className="rounded-3xl border border-blush bg-blush-soft p-7 sm:p-9">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <ShunyaBubble
              message={
                <>
                  Заполните короткую форму — мы проверим данные и опубликуем вашу
                  карточку. А промо-размещение в топе подключим, когда захотите!
                </>
              }
            />
            <ButtonLink
              href="/partners/new"
              size="lg"
              className="shrink-0"
            >
              <Send className="size-5" aria-hidden />
              Подать заявку
            </ButtonLink>
          </div>
        </div>
      </div>
    </Container>
  );
}
