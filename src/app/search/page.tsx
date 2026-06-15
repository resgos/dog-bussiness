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

type Params = { searchParams: Promise<{ q?: string }> };

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

export default async function SearchPage({ searchParams }: Params) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 80);
  const ready = query.length >= 2;
  const { losts, founds, pets } = ready
    ? await runSearch(query)
    : { losts: [], founds: [], pets: [] };
  const total = losts.length + founds.length + pets.length;

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
        <p className="mt-8 text-ink-soft">Введите минимум 2 символа.</p>
      ) : total === 0 ? (
        <div className="mt-8 rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble
            src="/shunya/pose-surprised.png"
            message={`По запросу «${query}» ничего не нашлось. Попробуй другое слово — кличку, породу или район.`}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <p className="text-sm text-ink-soft">Найдено: {total}</p>

          {losts.length ? (
            <section>
              <h2 className="text-2xl font-bold">🔴 Розыски</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {losts.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            </section>
          ) : null}

          {founds.length ? (
            <section>
              <h2 className="text-2xl font-bold">🐶 Находки</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {founds.map((f) => (
                  <FoundCard key={f.id} item={f} />
                ))}
              </div>
            </section>
          ) : null}

          {pets.length ? (
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
