import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Heart,
  Search,
  Home,
  MapPin,
  ShieldCheck,
  Phone,
  Megaphone,
  Gift,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { FaqSection } from "@/components/ui/FaqSection";

export const metadata = { title: "Если собака потерялась — план действий" };

const LOST_FAQ = [
  {
    q: "Сколько ждать, прежде чем начать искать?",
    a: "Не ждите — действуйте сразу. Первые часы решают: большинство собак находят рядом с домом, пока они не успели уйти далеко.",
  },
  {
    q: "Собака пугается и убегает, когда я подхожу. Что делать?",
    a: "Не преследуйте — погоня гонит её дальше. Присядьте боком, не смотрите в глаза, говорите спокойно и приманивайте лакомством, дайте подойти самой.",
  },
  {
    q: "Куда обращаться в первую очередь?",
    a: "Обзвоните ветклиники и приюты района, проверьте чип-реестры (Animal-ID.RU, AnimalFace) и подайте SOS в «Лапке» — соседи рядом получат уведомление.",
  },
  {
    q: "Как искать ночью?",
    a: "Возьмите фонарик и лакомство, зовите спокойным голосом на знакомых маршрутах прогулок. Ночью тише — испуганная собака скорее отзовётся и выйдет из укрытия.",
  },
  {
    q: "Стоит ли назначать вознаграждение?",
    a: "Да, даже небольшое вознаграждение заметно повышает активность поисков. Но не переводите предоплату за «возврат» — это частая схема мошенников; награду отдавайте лично после встречи.",
  },
];

type Step = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const STEPS: Step[] = [
  {
    icon: Clock,
    title: "Не паникуй, но действуй сразу",
    text: "Первые часы решают: большинство собак находят в радиусе 1–2 км от дома. Чем раньше начнёшь — тем выше шанс.",
  },
  {
    icon: Heart,
    title: "Не гонись за собакой",
    text: "Погоня пугает и гонит её дальше. Присядь боком, зови спокойным голосом, приманивай лакомством, дай подойти самой.",
  },
  {
    icon: Search,
    title: "Обыщи двор и укрытия рядом",
    text: "Испуганная собака часто прячется в 300 метрах: под крыльцом, в кустах, гаражах, подвалах, на стройках. Загляни туда с фонариком.",
  },
  {
    icon: Home,
    title: "Оставь дома «маяки»",
    text: "У подъезда или двери положи её лежанку либо твою ношеную вещь и миску с едой и водой. Знакомый запах приводит собаку обратно.",
  },
  {
    icon: MapPin,
    title: "Ищи там, где она гуляет",
    text: "Обойди и объезжай знакомые маршруты прогулок (окна открыты, зови по кличке). Показывай фото прохожим, дворникам и другим собачникам.",
  },
  {
    icon: ShieldCheck,
    title: "Проверь чип-реестр",
    text: "Убедись, что контакты в реестре чипа актуальны, и отметь питомца потерянным. Национальные базы — Animal-ID.RU и AnimalFace.",
  },
  {
    icon: Phone,
    title: "Обзвони и лично обойди клиники и приюты",
    text: "Найдёныша несут к ветеринарам и в приюты района. Заходи лично раз в 1–2 дня: новые животные поступают ежедневно, по фото узнать сложнее.",
  },
  {
    icon: Megaphone,
    title: "Подними район",
    text: "Подай SOS в «Лапке» — соседи в радиусе получат уведомление. Расклей плакат у подъездов и магазинов, репостни в районные чаты и соцсети.",
  },
  {
    icon: Gift,
    title: "Назначь вознаграждение",
    text: "Даже небольшая награда заметно мотивирует соседей искать активнее и сообщать о находках.",
  },
];

export default function GuideLostPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header>
          <Badge tone="lost">🆘 Спокойно, действуем</Badge>
          <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            Собака потерялась? План первых 24 часов
          </h1>
        </header>

        <ShunyaBubble
          src="/shunya/sm/pose-surprised.png"
          message="Главное — не паникуй. Большинство собак находят рядом с домом в первые часы. Идём по шагам — я рядом."
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

        <FaqSection items={LOST_FAQ} />

        <section className="mt-10 rounded-3xl border border-blush bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-bold text-ink">Национальные реестры чипов</h2>
          <p className="mt-2 leading-relaxed text-ink-soft">
            Если собака чипирована, отметь её потерянной в базе и проверь, что
            контакты актуальны. Самые крупные реестры РФ:
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <a
              href="https://www.animal-id.ru/search/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-petal-deep hover:underline"
            >
              Animal-ID.RU
            </a>
            <a
              href="https://animalface.ru/search/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-petal-deep hover:underline"
            >
              AnimalFace
            </a>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-blush-soft p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">
            Не теряй время — действуй сейчас
          </h2>
          <p className="mt-2 leading-relaxed text-ink-soft">
            Подними район за минуту и проверь чип — мы поможем на каждом шаге.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/sos" variant="sos" size="lg">
              🚨 Подать SOS о пропаже
            </ButtonLink>
            <ButtonLink href="/chip" variant="secondary" size="lg">
              Проверить чип
            </ButtonLink>
          </div>
          <p className="mt-5 text-sm">
            <Link
              href="/guide/found"
              className="font-semibold text-petal-deep hover:underline"
            >
              Я, наоборот, нашёл чужую собаку →
            </Link>
          </p>
        </section>
      </div>
    </Container>
  );
}
