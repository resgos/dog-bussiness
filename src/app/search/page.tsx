import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon, PawPrint } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ReportCard } from "@/components/feed/ReportCard";
import { FoundCard } from "@/components/found/FoundCard";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { districts, findDistrict } from "@/lib/districts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Поиск",
  description:
    "Поиск по розыскам, находкам и паспортам собак Москвы — кличка, порода, окрас, район.",
  alternates: { canonical: "/search" },
};

type Params = { searchParams: Promise<{ q?: string; type?: string }> };

// Вкладки-фильтры результатов по типу. Порядок = порядок секций ниже.
const TABS = [
  { key: "all", label: "Все" },
  { key: "lost", label: "🔴 Розыски" },
  { key: "found", label: "🐶 Находки" },
  { key: "pet", label: "🐾 Паспорта" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/** Поиск по активным розыскам, открытым находкам и публичным паспортам
 *  (только lost/found — «домашние» питомцы в выдачу не попадают, приватность). */
async function runSearch(query: string) {
  if (query.length < 2) return { losts: [], founds: [], pets: [] };
  const ci = { contains: query, mode: "insensitive" as const };
  // Запрос по названию района («Хамовники») → сопоставляем со слугом района.
  const districtIds = districts
    .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
    .map((d) => d.id);
  const dOr = districtIds.length ? [{ district: { in: districtIds } }] : [];

  const [losts, founds, pets] = await Promise.all([
    db.lostReport.findMany({
      where: {
        status: "active",
        OR: [{ petName: ci }, { breed: ci }, { color: ci }, { comment: ci }, ...dOr],
      },
      include: { sightings: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.foundReport.findMany({
      where: { status: "open", OR: [{ breed: ci }, { color: ci }, { comment: ci }, ...dOr] },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.pet.findMany({
      where: {
        status: { in: ["lost", "found"] },
        OR: [{ name: ci }, { breed: ci }, { color: ci }, ...dOr],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  return { losts, founds, pets };
}

const POPULAR_BREEDS = [
  "корги",
  "хаски",
  "лабрадор",
  "метис",
  "джек-рассел",
  "дворняжка",
];

export default async function SearchPage({ searchParams }: Params) {
  const { q, type: rawType } = await searchParams;
  const query = (q ?? "").trim().slice(0, 80);
  const ready = query.length >= 2;
  const { losts, founds, pets } = ready
    ? await runSearch(query)
    : { losts: [], founds: [], pets: [] };
  const total = losts.length + founds.length + pets.length;

  // Активная вкладка (Все/Розыски/Находки/Паспорта). Неизвестное значение → «Все».
  const type: TabKey = (TABS.some((t) => t.key === rawType) ? rawType : "all") as TabKey;
  const counts: Record<TabKey, number> = {
    all: total,
    lost: losts.length,
    found: founds.length,
    pet: pets.length,
  };
  const tabHref = (key: TabKey) =>
    key === "all"
      ? `/search?q=${encodeURIComponent(query)}`
      : `/search?q=${encodeURIComponent(query)}&type=${key}`;
  // Секцию показываем на вкладке «Все» и на её собственной вкладке (если не пуста).
  const show = (key: Exclude<TabKey, "all">) =>
    (type === "all" || type === key) && counts[key] > 0;

  // Быстрый browse при пустом/нулевом запросе: популярные породы и районы как
  // ссылки-чипы — поиск полезен сразу, без догадок «что ввести».
  const quickChips = (
    <div className="mt-8">
      <p className="text-sm font-semibold text-ink">Популярные породы</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {POPULAR_BREEDS.map((b) => (
          <Link
            key={b}
            href={`/search?q=${encodeURIComponent(b)}`}
            className="rounded-full border border-blush bg-card px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-petal hover:bg-blush-soft"
          >
            {b}
          </Link>
        ))}
      </div>
      <p className="mt-5 text-sm font-semibold text-ink">По районам</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {districts.slice(0, 8).map((d) => (
          <Link
            key={d.id}
            href={`/search?q=${encodeURIComponent(d.name)}`}
            className="rounded-full border border-blush bg-card px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-petal hover:bg-blush-soft"
          >
            {d.name}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <Container className="py-12 sm:py-16">
      <Badge tone="petal">
        <SearchIcon className="mr-1 inline size-4" aria-hidden /> Поиск
      </Badge>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Поиск по платформе</h1>
      <p className="mt-1 text-ink-soft">
        Кличка, порода, окрас или район — по розыскам, находкам и паспортам.
      </p>

      <form action="/search" method="get" className="mt-6 flex gap-2">
        <Input
          name="q"
          type="search"
          enterKeyHint="search"
          defaultValue={query}
          placeholder="Например: корги, рыжий, Хамовники"
          aria-label="Поисковый запрос"
          maxLength={80}
        />
        <Button type="submit" className="shrink-0">
          <SearchIcon className="size-4" aria-hidden />
          Найти
        </Button>
      </form>

      {!ready ? (
        <>
          <p className="mt-8 text-ink-soft">
            Введите минимум 2 символа — или выберите из популярного:
          </p>
          {quickChips}
        </>
      ) : total === 0 ? (
        <>
          <div className="mt-8 rounded-3xl border border-blush bg-card p-8 shadow-card">
            <ShunyaBubble
              src="/shunya/sm/pose-surprised.png"
              message={`По запросу «${query}» ничего не нашлось. Попробуй другое слово — кличку, породу или район.`}
            />
          </div>
          {quickChips}
        </>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Найдено: {total}</p>
            <div
              role="tablist"
              aria-label="Фильтр результатов по типу"
              className="flex flex-wrap gap-2"
            >
              {TABS.map((t) => {
                const active = type === t.key;
                return (
                  <Link
                    key={t.key}
                    href={tabHref(t.key)}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                      active
                        ? "border-petal bg-blush text-petal-deep"
                        : "border-blush bg-card text-ink hover:bg-blush-soft"
                    }`}
                  >
                    {t.label}
                    <span className="text-xs text-ink-soft">{counts[t.key]}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {type !== "all" && counts[type] === 0 ? (
            <div className="rounded-3xl border border-blush bg-card p-6 text-ink-soft shadow-card">
              В этом разделе по запросу «{query}» ничего нет.{" "}
              <Link
                href={tabHref("all")}
                className="font-semibold text-petal-deep hover:underline"
              >
                Показать все результаты
              </Link>
            </div>
          ) : null}

          {show("lost") ? (
            <section>
              <h2 className="text-2xl font-bold">🔴 Розыски</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {losts.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            </section>
          ) : null}

          {show("found") ? (
            <section>
              <h2 className="text-2xl font-bold">🐶 Находки</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {founds.map((f) => (
                  <FoundCard key={f.id} item={f} />
                ))}
              </div>
            </section>
          ) : null}

          {show("pet") ? (
            <section>
              <h2 className="text-2xl font-bold">🐾 Паспорта</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pets.map((p) => {
                  const place = p.district ? findDistrict(p.district)?.name : null;
                  return (
                    <Link
                      key={p.id}
                      href={`/p/${p.id}`}
                      className="flex items-center gap-4 rounded-3xl border border-blush bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
                    >
                      <span className="relative block size-16 shrink-0 overflow-hidden rounded-2xl bg-blush-soft">
                        {p.photo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.photo} alt={p.name} className="size-full object-cover" />
                        ) : (
                          <span className="flex size-full items-center justify-center text-petal">
                            <PawPrint className="size-7" aria-hidden />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-ink">{p.name}</span>
                        <span className="block truncate text-sm text-ink-soft">
                          {[p.breed, place].filter(Boolean).join(" · ") || "Паспорт питомца"}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </Container>
  );
}
