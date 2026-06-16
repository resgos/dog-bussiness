import { MapPin, Printer, Rss } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { LostFilters } from "@/components/feed/LostFilters";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Потерялись",
  // Авто-обнаружение RSS фид-ридерами и браузерами (rel="alternate").
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/feed/lost/rss", title: "Лапка помощи — активные пропажи" },
      ],
    },
  },
};

export default async function FeedLostPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string }>;
}) {
  // Глубокая ссылка из «Пульса»/шеринга: ?district=… предвыбирает фильтр района.
  const { district: initialDistrict } = await searchParams;
  // Ленте нужно лишь ЧИСЛО наблюдений (ReportCard: sightings.length), поэтому
  // тянем только их id — не таскаем тяжёлые photo/comment наблюдений.
  const reports = await db.lostReport.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    include: { sightings: { select: { id: true } } },
  });

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge tone="lost">🔴 Потерялись</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Активные поиски</h1>
          <p className="mt-1 text-ink-soft">Каждая минута на счету — помоги найти.</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <a
              href="/feed/lost/rss"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
            >
              <Rss className="size-4" aria-hidden />
              RSS-лента пропаж
            </a>
            {initialDistrict ? (
              <>
                <a
                  href={`/district/${encodeURIComponent(initialDistrict)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
                >
                  <MapPin className="size-4" aria-hidden />
                  Страница района
                </a>
                <a
                  href={`/poster/district/${encodeURIComponent(initialDistrict)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
                >
                  <Printer className="size-4" aria-hidden />
                  Листовка района
                </a>
              </>
            ) : null}
          </div>
        </div>
        <ButtonLink href="/sos" variant="sos" size="lg">
          Сообщить о пропаже
        </ButtonLink>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble message="Сейчас в районе никто не потерялся — и это здорово! Гуляйте спокойно." />
        </div>
      ) : (
        <LostFilters reports={reports} initialDistrict={initialDistrict ?? null} />
      )}
    </Container>
  );
}
