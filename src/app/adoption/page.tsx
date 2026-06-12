import { Suspense } from "react";
import { PlusCircle } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { AdoptionList } from "@/components/adoption/AdoptionList";
import type { AdoptionItem } from "@/components/adoption/AdoptionCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Забрать друга" };

// Загрузку — в дочерний async-компонент под inline <Suspense>, а не segment
// loading.tsx: иначе soft-404 (HTTP 200) на дочерней /adoption/[id] при notFound().
async function AdoptionFeed() {
  const listings = await db.adoptionListing.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
  });

  const items: AdoptionItem[] = listings.map((l) => ({
    id: l.id,
    name: l.name,
    breed: l.breed,
    age: l.age,
    size: l.size,
    color: l.color,
    photo: l.photo,
    district: l.district,
    story: l.story,
    contactName: l.contactName,
    contactPhone: l.contactPhone,
    contactTelegram: l.contactTelegram,
    createdAt: l.createdAt,
  }));

  return <AdoptionList items={items} />;
}

function AdoptionSkeleton() {
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

export default function AdoptionPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="petal">🏠 Приюты</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Собаки ищут дом
          </h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Эти хвостики из приютов и добрых рук уже готовы стать членом семьи.
            Подари другу дом — а Шуня поможет вам найти друг друга. Каждый из них
            мечтает о тёплом одеяле и человеке рядом.
          </p>
        </div>
        <ButtonLink href="/adoption/new" size="lg" className="shrink-0">
          <PlusCircle className="size-5" aria-hidden />
          Разместить собаку
        </ButtonLink>
      </div>

      <Suspense fallback={<AdoptionSkeleton />}>
        <AdoptionFeed />
      </Suspense>
    </Container>
  );
}
