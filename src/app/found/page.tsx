import { Suspense } from "react";
import { PlusCircle, Rss } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { FoundList } from "@/components/found/FoundList";
import type { FoundItem } from "@/components/found/FoundCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Найденные собаки" };

// Загрузку выносим в дочерний async-компонент под inline <Suspense>, а НЕ в
// segment-level loading.tsx: иначе Suspense-граница сегмента отдаёт shell со
// статусом 200 раньше, чем notFound() на дочерних /found/[id]* → soft-404 для
// всего поддерева (плохо для SEO). Скелетон при этом сохраняем.
async function FoundFeed() {
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

  return <FoundList items={items} />;
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

export default function FoundPage() {
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
          <a
            href="/feed/found/rss"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
          >
            <Rss className="size-4" aria-hidden />
            RSS-лента находок
          </a>
        </div>
        <ButtonLink href="/found/new" size="lg" className="shrink-0">
          <PlusCircle className="size-5" aria-hidden />
          Сообщить о находке
        </ButtonLink>
      </div>

      <Suspense fallback={<FoundFeedSkeleton />}>
        <FoundFeed />
      </Suspense>
    </Container>
  );
}
