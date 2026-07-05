import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, PlusCircle } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { ShareButton } from "@/components/share/ShareButton";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

// Дедуп выборки между generateMetadata и страницей (один запрос вместо двух).
const getReunion = cache((id: string) =>
  db.reunion.findUnique({ where: { id } }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const reunion = await getReunion(id);
  return {
    title: reunion ? `${reunion.petName} снова дома 💞` : "История спасения",
  };
}

export default async function ReunionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reunion = await getReunion(id);
  if (!reunion) notFound();

  const district = reunion.district
    ? findDistrict(reunion.district)?.name
    : null;

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/reunited"
        className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep transition hover:text-petal"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Все истории
      </Link>

      <div className="mt-6 max-w-2xl">
        {/* Фото — клик открывает оригинал целиком в лайтбоксе */}
        {reunion.photo ? (
          <PhotoLightbox
            src={reunion.photo}
            alt={`${reunion.petName} снова дома`}
            className="relative block aspect-[4/3] w-full overflow-hidden rounded-3xl border border-blush bg-blush-soft shadow-card"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl border border-blush bg-blush-soft shadow-card">
            <div className="relative size-36 sm:size-44">
              <Image
                src="/shunya/sm/pose-happy.png"
                alt="Шуня"
                fill
                sizes="176px"
                className="object-contain"
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <Badge tone="found">💞 Дома</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {reunion.petName} снова дома
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
            {district ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-petal" aria-hidden />
                {district}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-petal" aria-hidden />
              {timeAgo(reunion.createdAt)}
            </span>
          </div>
        </div>

        {/* Полный текст истории — без сокращений */}
        <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink">
          {reunion.story}
        </p>

        {/* CTA: одна счастливая история вдохновляет следующую */}
        <div className="mt-10 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold text-ink">
            Твоя собака тоже вернулась домой?
          </h2>
          <p className="mt-2 text-ink-soft">
            Расскажи, как это было — твоя история поддержит тех, кто ещё ищет
            своего хвостика.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ButtonLink href="/reunited/new">
              <PlusCircle className="size-5" aria-hidden />
              Рассказать свою историю
            </ButtonLink>
            <ShareButton
              path={`/reunited/${reunion.id}`}
              title={`${reunion.petName} снова дома!`}
              text="Счастливая история на «Лапке помощи»: собака снова дома."
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
