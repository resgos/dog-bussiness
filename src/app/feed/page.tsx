import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ReportCard } from "@/components/feed/ReportCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Лента объявлений" };

export default async function FeedPage() {
  const [lost, found, recent] = await Promise.all([
    db.lostReport.count({ where: { status: "active" } }),
    db.lostReport.count({ where: { status: "found" } }),
    db.lostReport.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { sightings: true },
    }),
  ]);

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="petal">📰 Лента</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Лента объявлений</h1>
        </div>
        <ButtonLink href="/map" variant="secondary">
          <Map className="size-4" aria-hidden />
          На карту
        </ButtonLink>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/feed/lost"
          className="flex items-center justify-between rounded-3xl border border-blush bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
        >
          <div>
            <p className="text-3xl font-bold text-status-lost">{lost}</p>
            <p className="font-semibold text-ink">🔴 Потерялись</p>
          </div>
          <ArrowRight className="size-5 text-ink-soft" aria-hidden />
        </Link>
        <Link
          href="/feed/found"
          className="flex items-center justify-between rounded-3xl border border-blush bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
        >
          <div>
            <p className="text-3xl font-bold text-status-found-ink">{found}</p>
            <p className="font-semibold text-ink">🟢 Найдены</p>
          </div>
          <ArrowRight className="size-5 text-ink-soft" aria-hidden />
        </Link>
      </div>

      {recent.length > 0 ? (
        <>
          <h2 className="mb-5 text-xl font-bold">Свежие поиски</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </>
      ) : null}
    </Container>
  );
}
