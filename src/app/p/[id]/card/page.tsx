import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PassportCard } from "@/components/pets/PassportCard";

export const dynamic = "force-dynamic";

// Печатная утилита, не для индексации поисковиками.
export const metadata: Metadata = {
  title: "QR-бирка на ошейник",
  robots: { index: false, follow: false },
};

export default async function PassportCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await db.pet.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      breed: true,
      color: true,
      photo: true,
      district: true,
      chip: true,
      status: true,
    },
  });
  if (!pet) notFound();

  return <PassportCard pet={pet} />;
}
