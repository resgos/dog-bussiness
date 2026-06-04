import { PlusCircle } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { FoundList } from "@/components/found/FoundList";
import type { FoundItem } from "@/components/found/FoundCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Найденные собаки" };

export default async function FoundPage() {
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
        </div>
        <ButtonLink href="/found/new" size="lg" className="shrink-0">
          <PlusCircle className="size-5" aria-hidden />
          Сообщить о находке
        </ButtonLink>
      </div>

      <FoundList items={items} />
    </Container>
  );
}
