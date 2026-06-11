import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { FoundPoster } from "@/components/poster/FoundPoster";

// Контакты/статус находки могут меняться — всегда свежие данные.
export const dynamic = "force-dynamic";

const getFound = cache((id: string) =>
  db.foundReport.findUnique({ where: { id } }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getFound(id);
  const facts = item
    ? [item.breed, item.color].filter(Boolean).join(" · ")
    : null;
  return { title: `Плакат · ${facts || "Найдена собака"}` };
}

export default async function FoundPosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getFound(id);
  if (!item) notFound();

  return (
    <FoundPoster
      found={{
        id: item.id,
        breed: item.breed,
        color: item.color,
        size: item.size,
        district: item.district,
        photo: item.photo,
        comment: item.comment,
        finderName: item.finderName,
        contactPhone: item.contactPhone,
        contactTelegram: item.contactTelegram,
        createdAt: item.createdAt.toISOString(),
      }}
    />
  );
}
