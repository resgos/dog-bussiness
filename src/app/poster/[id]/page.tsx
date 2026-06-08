import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LostPoster } from "@/components/poster/LostPoster";

// Данные плаката всегда свежие (телефон/награда/статус могут меняться).
export const dynamic = "force-dynamic";

// Дедуп выборки между generateMetadata и страницей (один запрос вместо двух).
const getReport = cache((id: string) =>
  db.lostReport.findUnique({ where: { id } }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  return { title: `Плакат · ${report?.petName ?? "Розыск"}` };
}

export default async function PosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  // Связанный питомец нужен ради контактов (showPhone/ownerPhone) и доп. примет.
  const pet = report.petId
    ? await db.pet.findUnique({ where: { id: report.petId } })
    : null;

  return (
    <LostPoster
      report={{
        id: report.id,
        petId: report.petId,
        petName: report.petName,
        breed: report.breed,
        photo: report.photo,
        district: report.district,
        lostAt: report.lostAt ? report.lostAt.toISOString() : null,
        comment: report.comment,
        reward: report.reward,
      }}
      pet={
        pet
          ? {
              photo: pet.photo,
              color: pet.color,
              marksText: pet.marksText,
              ownerPhone: pet.ownerPhone,
              telegram: pet.telegram,
              showPhone: pet.showPhone,
            }
          : null
      }
    />
  );
}
