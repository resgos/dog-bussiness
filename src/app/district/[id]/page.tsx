import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  MapPin,
  PawPrint,
  Printer,
  Rss,
  Search,
  Store,
} from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ReportCard } from "@/components/feed/ReportCard";
import { FoundCard } from "@/components/found/FoundCard";
import { PartnerCard } from "@/components/services/PartnerCard";
import { ShareButton } from "@/components/share/ShareButton";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { findDistrict, districts } from "@/lib/districts";
import { timeAgo, plural } from "@/lib/format";

// Хаб района всегда свежий — это сводка «прямо сейчас», кэшировать нельзя.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const d = findDistrict(id);
  if (!d) return { title: "Район не найден" };
  return {
    title: `Собаки района ${d.name} — розыски, находки и истории`,
    description: `Кого сейчас ищут и кого нашли в районе ${d.name} (${d.okrug}, Москва). Активные розыски, найденные собаки и счастливые возвращения домой — в одном месте.`,
    alternates: { canonical: `/district/${d.id}` },
  };
}

async function loadDistrict(id: string) {
  const [active, found, reunions, partners, activeCount, foundCount, reunionCount] =
    await Promise.all([
      db.lostReport.findMany({
        where: { district: id, status: "active" },
        include: { sightings: { select: { id: true } } },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.foundReport.findMany({
        where: { district: id, status: "open" },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.reunion.findMany({
        where: { district: id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      // «Друзья района» — партнёрские слоты (P1 #5): featured (платное промо)
      // первыми, только одобренные.
      db.partner.findMany({
        where: { district: id, status: "approved" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 4,
      }),
      db.lostReport.count({ where: { district: id, status: "active" } }),
      db.foundReport.count({ where: { district: id, status: "open" } }),
      db.reunion.count({ where: { district: id } }),
    ]);
  return {
    active,
    found,
    reunions,
    partners,
    counts: { active: activeCount, found: foundCount, reunions: reunionCount },
  };
}

export default async function DistrictHubPage({ params }: Params) {
  const { id } = await params;
  const d = findDistrict(id);
  if (!d) notFound();

  const data = await loadDistrict(id).catch(() => ({
    active: [],
    found: [],
    reunions: [],
    partners: [],
    counts: { active: 0, found: 0, reunions: 0 },
  }));
  const { active, found, reunions, partners, counts } = data;

  // Районы того же округа: собака легко переходит границу района — даём искателю
  // быстрый переход к соседям.
  const sameOkrug = districts.filter(
    (x) => x.okrug === d.okrug && x.id !== d.id,
  );

  const stats = [
    {
      label: plural(counts.active, "в розыске", "в розыске", "в розыске"),
      value: counts.active,
      Icon: Search,
      tone: "text-coral",
    },
    {
      label: "находок ждут",
      value: counts.found,
      Icon: PawPrint,
      tone: "text-petal-deep",
    },
    {
      label: "вернулись домой",
      value: counts.reunions,
      Icon: Heart,
      tone: "text-status-found",
    },
  ];

  return (
    <Container className="py-10 sm:py-14">
      {/* Навигация наверх к обзору районов */}
      <Link
        href="/pulse"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Все районы
      </Link>

      {/* Шапка района */}
      <div className="mt-4 max-w-2xl">
        <Badge tone="petal">
          <MapPin className="mr-1 inline size-4" aria-hidden />
          {d.okrug}
        </Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Район {d.name}</h1>
        <p className="mt-2 text-lg text-ink-soft">
          Что происходит с собаками в районе прямо сейчас: кого ищут, кого нашли
          и кто уже дома.
        </p>
      </div>

      {/* Три ключевые цифры района */}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <div className="flex items-center gap-3 rounded-2xl border border-blush bg-card p-5 shadow-card">
              <s.Icon className={`size-7 shrink-0 ${s.tone}`} aria-hidden />
              <div>
                <span className="font-display text-3xl font-bold leading-none">
                  {s.value}
                </span>
                <span className="ml-2 text-sm text-ink-soft">{s.label}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Действия */}
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/sos" variant="sos" size="md">
          Сообщить о пропаже
        </ButtonLink>
        <ButtonLink href="/found" variant="secondary" size="md">
          <PawPrint className="size-4" aria-hidden /> Я нашёл собаку
        </ButtonLink>
        <ButtonLink
          href={`/poster/district/${d.id}`}
          variant="secondary"
          size="md"
        >
          <Printer className="size-4" aria-hidden /> Листовка района
        </ButtonLink>
        <ShareButton
          path={`/district/${d.id}`}
          title={`Собаки района ${d.name} — Лапка помощи`}
          text={`Район ${d.name}: ${counts.active} в розыске, ${counts.found} ${plural(
            counts.found,
            "находка",
            "находки",
            "находок",
          )} ждут хозяев. Загляните и помогите вернуть собак домой.`}
          label="Поделиться районом"
        />
        <a
          href="/feed/lost/rss"
          className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-petal-deep hover:underline"
        >
          <Rss className="size-4" aria-hidden /> RSS пропаж
        </a>
      </div>

      {/* Активные розыски */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Search className="size-6 text-coral" aria-hidden />
            Активные розыски
          </h2>
          {counts.active > active.length ? (
            <Link
              href={`/feed/lost?district=${encodeURIComponent(d.id)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
            >
              Показать все {counts.active}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>

        {active.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-blush bg-card p-6 shadow-card">
            <ShunyaBubble message="В этом районе сейчас никто не в розыске — и пусть так и будет. Если собака потеряется, стая поднимется на помощь." />
          </div>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>

      {/* Находки района */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <PawPrint className="size-6 text-petal-deep" aria-hidden />
            Находки рядом
          </h2>
          {counts.found > found.length ? (
            <Link
              href={`/found?district=${encodeURIComponent(d.id)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
            >
              Показать все {counts.found}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>

        {found.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-blush bg-card p-6 shadow-card">
            <p className="text-ink-soft">
              Пока никто не отметил найденную собаку в этом районе. Нашли —{" "}
              <Link
                href="/found"
                className="font-semibold text-petal-deep hover:underline"
              >
                сообщите о находке
              </Link>
              , и хозяин увидит её быстрее.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {found.map((f) => (
              <FoundCard key={f.id} item={f} />
            ))}
          </div>
        )}
      </section>

      {/* Истории возвращений */}
      {reunions.length > 0 ? (
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Heart className="size-6 text-status-found" aria-hidden />
            Уже дома
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Счастливые финалы из района {d.name}.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reunions.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-blush bg-card p-5 shadow-card"
              >
                <div className="flex items-center gap-2">
                  <Heart className="size-4 text-status-found" aria-hidden />
                  <h3 className="font-semibold">{r.petName}</h3>
                  <span className="ml-auto text-xs text-ink-soft">
                    {timeAgo(r.createdAt)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-ink-soft">
                  {r.story}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/reunited"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
            >
              Все истории возвращений
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      ) : null}

      {/* «Друзья района» — партнёрские слоты (P1 #5): проверенные сервисы для
          собак; featured (платное промо) первыми. CTA — B2B-вход на /partners. */}
      {partners.length > 0 ? (
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Store className="size-6 text-petal-deep" aria-hidden />
              Друзья района
            </h2>
            <Link
              href="/partners"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
            >
              Разместить свой сервис
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Проверенные сервисы для собак в районе {d.name}.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((p) => (
              <PartnerCard key={p.id} partner={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Районы рядом: соседи того же округа */}
      {sameOkrug.length > 0 ? (
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <MapPin className="size-6 text-petal" aria-hidden />
            Районы рядом · {d.okrug}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Собака легко переходит границу района — загляните к соседям.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sameOkrug.map((x) => (
              <Link
                key={x.id}
                href={`/district/${x.id}`}
                className="rounded-full border border-blush bg-card px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-petal hover:bg-blush-soft"
              >
                {x.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Подвал — на карту и к обзору районов */}
      <Reveal>
        <div className="mt-14 flex flex-col items-center gap-5 rounded-[2.5rem] border border-blush bg-gradient-to-br from-blush-soft to-card p-8 text-center shadow-card sm:p-10">
          <div className="relative size-20">
            <Image
              src="/shunya/pose-happy-cut.png"
              alt="Шуня"
              fill
              sizes="80px"
              className="object-contain"
            />
          </div>
          <p className="max-w-xl text-lg text-ink-soft">
            Чем больше соседей в стае, тем быстрее находятся собаки. Загляните на
            карту района или поднимите тревогу, если кто-то потерялся.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/map" variant="secondary" size="lg">
              <MapPin className="size-5" aria-hidden /> Карта
            </ButtonLink>
            <ButtonLink href="/pulse" size="lg">
              Пульс по районам <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </Container>
  );
}
