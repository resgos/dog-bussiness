import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Eye,
  Heart,
  HeartHandshake,
  MapPin,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { findDistrict } from "@/lib/districts";
import { plural } from "@/lib/format";
import { rescueRate } from "@/lib/pulse";

// Живые цифры — всегда свежие, без кэша.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Пульс спасения — живая статистика «Лапки помощи»",
  description:
    "Сколько собак сейчас в розыске, сколько находок ждут хозяев и сколько уже вернулись домой. Живой пульс стаи по районам Москвы.",
};

type Pulse = {
  activeLost: number;
  foundLost: number;
  openFound: number;
  reunions: number;
  sightingsWeek: number;
  helped: number;
  districts: { key: string; name: string; count: number }[];
  revenue: { kind: string; totalRub: number }[];
};

/** Человекочитаемые каналы монетизации (Purchase.kind). */
const REVENUE_LABELS: Record<string, string> = {
  boost: "🚀 Продвижение объявлений",
  plus: "⭐ Подписка «Лапка+»",
  partner: "🤝 Партнёрские размещения",
  "poster-service": "🚚 Расклейка плакатов",
};

// Читаем агрегаты одним заходом. Дашборд публичный — при сбое БД мягко
// деградируем до нулей, а не роняем страницу 500-кой.
async function loadPulse(): Promise<Pulse> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  try {
    const [activeLost, foundLost, openFound, reunions, sightingsWeek, helpedAgg, grouped, purchases] =
      await Promise.all([
        db.lostReport.count({ where: { status: "active" } }),
        db.lostReport.count({ where: { status: "found" } }),
        db.foundReport.count({ where: { status: "open" } }),
        db.reunion.count(),
        db.sighting.count({ where: { createdAt: { gte: weekAgo } } }),
        db.user.aggregate({ _sum: { helpedCount: true } }),
        db.lostReport.groupBy({
          by: ["district"],
          where: { status: "active", district: { not: null } },
          _count: { district: true },
          orderBy: { _count: { district: "desc" } },
          take: 6,
        }),
        // Экономика: суммы по каналам монетизации (реестр Purchase).
        db.purchase.groupBy({
          by: ["kind"],
          _sum: { amountRub: true },
        }),
      ]);
    const districts = grouped
      .map((g) => ({
        key: g.district as string,
        name: findDistrict(g.district as string)?.name ?? (g.district as string),
        count: g._count.district,
      }))
      .filter((d) => d.count > 0);
    return {
      activeLost,
      foundLost,
      openFound,
      reunions,
      sightingsWeek,
      helped: helpedAgg._sum.helpedCount ?? 0,
      districts,
      revenue: purchases.map((g) => ({
        kind: g.kind,
        totalRub: g._sum.amountRub ?? 0,
      })),
    };
  } catch {
    return {
      activeLost: 0,
      foundLost: 0,
      openFound: 0,
      reunions: 0,
      sightingsWeek: 0,
      helped: 0,
      districts: [],
      revenue: [],
    };
  }
}

const fmt = (n: number) => n.toLocaleString("ru-RU");

export default async function PulsePage() {
  const p = await loadPulse();
  // Доля найденных среди завершённых+активных розысков — честная одно-доменная
  // метрика (не путать с числом добровольных историй «Уже дома»).
  const rate = rescueRate(p.foundLost, p.activeLost);
  const maxDistrict = Math.max(1, ...p.districts.map((d) => d.count));

  // Экономика: выручка сервисов платформы отдельно от денег сообщества
  // (донаты на награды идут нашедшим, а не платформе — честное разделение).
  const donatedRub =
    p.revenue.find((r) => r.kind === "reward-donation")?.totalRub ?? 0;
  const serviceRevenue = p.revenue
    .filter((r) => r.kind !== "reward-donation" && r.totalRub > 0)
    .sort((a, b) => b.totalRub - a.totalRub);
  const serviceTotalRub = serviceRevenue.reduce((a, r) => a + r.totalRub, 0);

  const stats = [
    {
      label: "Сейчас в розыске",
      value: p.activeLost,
      caption: "активных объявлений о пропаже",
      Icon: Search,
      tone: "text-coral",
    },
    {
      label: "Находок ждут хозяев",
      value: p.openFound,
      caption: "кто-то уже нашёл — ищем владельца",
      Icon: PawPrint,
      tone: "text-petal-deep",
    },
    {
      label: "Уже дома",
      value: p.reunions,
      caption: "историй счастливых возвращений",
      Icon: Heart,
      tone: "text-status-found",
    },
    {
      label: "Наблюдений за неделю",
      value: p.sightingsWeek,
      caption: "отметок «видели собаку» на карте",
      Icon: Eye,
      tone: "text-petal",
    },
  ];

  return (
    <Container className="py-12 sm:py-16">
      {/* Заголовок */}
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="petal">
          <Activity className="mr-1 inline size-4" aria-hidden /> Пульс спасения
        </Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Пульс спасения</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Живая картина стаи прямо сейчас: кого ищут, кого нашли и сколько собак
          уже вернулись домой.
        </p>
      </div>

      {/* Четыре ключевые метрики */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <div className="flex h-full flex-col gap-2 rounded-3xl border border-blush bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
              <s.Icon className={`size-7 ${s.tone}`} aria-hidden />
              <span className="font-display text-4xl font-bold leading-none sm:text-5xl">
                {fmt(s.value)}
              </span>
              <span className="font-semibold text-ink">{s.label}</span>
              <span className="text-sm leading-snug text-ink-soft">
                {s.caption}
              </span>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Доля возвращений домой */}
      <Reveal>
        <div className="mt-6 grid items-center gap-6 rounded-[2.5rem] border border-blush bg-gradient-to-br from-blush-soft to-card p-8 shadow-card sm:p-10 lg:grid-cols-[auto_1fr_auto]">
          <div className="relative mx-auto size-28 shrink-0 sm:size-32">
            <Image
              src="/shunya/pose-happy-cut.png"
              alt="Шуня радуется возвращениям"
              fill
              sizes="128px"
              className="object-contain"
            />
          </div>
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm font-bold text-petal-deep">
              <ShieldCheck className="size-4" aria-hidden /> Возвращаются домой
            </span>
            <p className="mt-3 flex flex-wrap items-baseline justify-center gap-x-3 lg:justify-start">
              <span className="font-display text-5xl font-bold leading-none text-status-found-ink sm:text-6xl">
                {rate}%
              </span>
              <span className="text-base text-ink-soft sm:text-lg">
                собак из ленты розыска уже нашлись и вернулись домой
              </span>
            </p>
          </div>
          <ButtonLink
            href="/reunited"
            variant="secondary"
            size="lg"
            className="mx-auto lg:mx-0"
          >
            Истории <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </div>
      </Reveal>

      {/* Где сейчас нужнее помощь */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <MapPin className="size-6 text-petal" aria-hidden />
          <h2 className="text-2xl font-bold">Где сейчас нужнее помощь</h2>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Районы Москвы с наибольшим числом активных розысков — нажмите, чтобы открыть ленту района.
        </p>

        {p.districts.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-blush bg-card p-6 shadow-card">
            <p className="text-ink-soft">
              Сейчас активных розысков нет — и пусть так и будет. Если собака
              потеряется, стая поднимется на помощь.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {p.districts.map((d, i) => (
              <Reveal key={d.key} delay={i * 0.05}>
                <Link
                  href={`/feed/lost?district=${encodeURIComponent(d.key)}`}
                  className="group flex items-center gap-4 rounded-2xl border border-blush bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
                >
                  <span className="w-8 shrink-0 text-center font-display text-xl font-bold text-petal-deep">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-bold text-ink group-hover:text-petal-deep">
                        {d.name}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-petal-deep">
                        {d.count}{" "}
                        {plural(d.count, "розыск", "розыска", "розысков")}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-blush-soft">
                      <div
                        className="h-full rounded-full bg-petal"
                        style={{
                          width: `${Math.round((d.count / maxDistrict) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <ArrowRight
                    className="size-5 shrink-0 text-petal transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </Reveal>
            ))}
            <div className="mt-2 flex flex-wrap gap-3">
              <ButtonLink href="/feed/lost" size="md">
                <Search className="size-4" aria-hidden /> Лента розыска
              </ButtonLink>
              <ButtonLink href="/map" variant="secondary" size="md">
                <MapPin className="size-4" aria-hidden /> Карта
              </ButtonLink>
            </div>
          </div>
        )}
      </section>

      {/* Экономика платформы: выручка сервисов + деньги сообщества (демо) */}
      {serviceTotalRub > 0 || donatedRub > 0 ? (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Wallet className="size-6 text-petal-deep" aria-hidden />
            <h2 className="text-2xl font-bold">Экономика платформы</h2>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Прозрачно: сколько сервисы «Лапки» заработали и сколько соседи
            собрали на награды (демо-оплаты).
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-blush bg-card p-6 shadow-card">
              <p className="inline-flex items-center gap-2 font-bold text-ink">
                <Wallet className="size-5 text-petal-deep" aria-hidden />
                Выручка сервисов
              </p>
              <p
                className="mt-2 font-display text-4xl font-bold leading-none"
                data-revenue-total={serviceTotalRub}
              >
                {fmt(serviceTotalRub)} ₽
              </p>
              <ul className="mt-4 space-y-2">
                {serviceRevenue.map((r) => (
                  <li
                    key={r.kind}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="text-ink">
                      {REVENUE_LABELS[r.kind] ?? r.kind}
                    </span>
                    <span className="shrink-0 font-semibold text-petal-deep">
                      {fmt(r.totalRub)} ₽
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-blush bg-card p-6 shadow-card">
              <p className="inline-flex items-center gap-2 font-bold text-ink">
                <HeartHandshake className="size-5 text-status-found-ink" aria-hidden />
                Соседи собрали на награды
              </p>
              <p
                className="mt-2 font-display text-4xl font-bold leading-none text-status-found-ink"
                data-donated-total={donatedRub}
              >
                {fmt(donatedRub)} ₽
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Донаты идут нашедшим, а не платформе: деньги района работают на
                возвращение собак домой.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Сила стаи + финальный призыв */}
      <Reveal>
        <div className="mt-10 flex flex-col items-center gap-5 rounded-[2.5rem] border border-blush bg-card p-8 text-center shadow-card sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm font-bold text-petal-deep">
            <Sparkles className="size-4" aria-hidden /> Сила стаи
          </span>
          <p className="max-w-2xl text-lg text-ink-soft">
            Вместе соседи уже {fmt(p.helped)}{" "}
            {plural(p.helped, "раз помогли", "раза помогли", "раз помогли")}{" "}
            вернуть собаку домой. Присоединяйся — даже одно наблюдение приближает
            встречу.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/sos" variant="sos" size="lg">
              Подать SOS
            </ButtonLink>
            <ButtonLink href="/map" variant="secondary" size="lg">
              Помочь на карте
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </Container>
  );
}
