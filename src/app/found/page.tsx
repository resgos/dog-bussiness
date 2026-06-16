import { Suspense } from "react";
import { MapPin, PlusCircle, Printer, Rss } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { FoundList } from "@/components/found/FoundList";
import type { FoundItem } from "@/components/found/FoundCard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Найденные собаки",
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/feed/found/rss", title: "Лапка помощи — найденные собаки" },
      ],
    },
  },
};

// Загрузку выносим в дочерний async-компонент под inline <Suspense>, а НЕ в
// segment-level loading.tsx: иначе Suspense-граница сегмента отдаёт shell со
// статусом 200 раньше, чем notFound() на дочерних /found/[id]* → soft-404 для
// всего поддерева (плохо для SEO). Скелетон при этом сохраняем.
async function FoundFeed({ initialDistrict }: { initialDistrict: string | null }) {
  const found = await db.foundReport.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
  });

  const items: FoundItem[] = found.map((f) => ({
    id: f.id,
    finderName: f.finderName,
    contactPhone: f.contactPhone,
    contactTelegram: f.contactTelegram,
    photo: f.photo,
    breed: f.breed,
    color: f.color,
    size: f.size,
    district: f.district,
    comment: f.comment,
    createdAt: f.createdAt,
  }));

  return <FoundList items={items} initialDistrict={initialDistrict} />;
}

function FoundFeedSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-72 animate-pulse rounded-3xl border border-blush bg-blush-soft/60"
        />
      ))}
    </div>
  );
}

export default async function FoundPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string }>;
}) {
  // Глубокая ссылка из хаба района/шеринга: ?district=… предвыбирает фильтр района.
  const { district } = await searchParams;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="found">🔎 Находки</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Нашли собаку — ищем хозяев
          </h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Кто-то подобрал чужую или бездомную собаку и ищет её хозяина. Узнали
            питомца? Свяжитесь с тем, кто его нашёл.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <a
              href="/feed/found/rss"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
            >
              <Rss className="size-4" aria-hidden />
              RSS-лента находок
            </a>
            {district ? (
              <>
                <a
                  href={`/district/${encodeURIComponent(district)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
                >
                  <MapPin className="size-4" aria-hidden />
                  Страница района
                </a>
                <a
                  href={`/poster/district/${encodeURIComponent(district)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
                >
                  <Printer className="size-4" aria-hidden />
                  Листовка района
                </a>
              </>
            ) : null}
          </div>
        </div>
        <ButtonLink href="/found/new" size="lg" className="shrink-0">
          <PlusCircle className="size-5" aria-hidden />
          Сообщить о находке
        </ButtonLink>
      </div>

      <Suspense fallback={<FoundFeedSkeleton />}>
        <FoundFeed initialDistrict={district ?? null} />
      </Suspense>
    </Container>
  );
}
