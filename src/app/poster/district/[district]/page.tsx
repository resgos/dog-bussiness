import type { Metadata } from "next";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";
import { Container } from "@/components/ui/Container";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { DistrictFlyer } from "@/components/poster/DistrictFlyer";

// Данные всегда свежие — состав пропаж района меняется.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ district: string }>;
}): Promise<Metadata> {
  const { district } = await params;
  const name = findDistrict(district)?.name ?? district;
  return { title: `Листовка района · ${name}` };
}

export default async function DistrictFlyerPage({
  params,
}: {
  params: Promise<{ district: string }>;
}) {
  const { district } = await params;
  const name = findDistrict(district)?.name ?? district;

  const dogs = await db.lostReport.findMany({
    where: { status: "active", district },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: { id: true, petName: true, breed: true, photo: true, reward: true },
  });

  if (dogs.length === 0) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-xl">
          <ShunyaBubble
            message={`В районе «${name}» сейчас нет активных пропаж — и пусть так и будет! Печатать пока нечего.`}
          />
        </div>
      </Container>
    );
  }

  return <DistrictFlyer districtName={name} dogs={dogs} />;
}
