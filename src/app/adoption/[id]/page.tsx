import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, PawPrint, Phone, Send } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { ShareButton } from "@/components/share/ShareButton";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";
import { sizeOptions } from "@/lib/petForm";

// Статус анкеты меняется (собаку могли уже забрать) — данные держим свежими.
export const dynamic = "force-dynamic";

// Дедуп выборки между generateMetadata и страницей (один запрос вместо двух).
const getListing = cache((id: string) =>
  db.adoptionListing.findUnique({ where: { id } }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  return { title: listing ? `${listing.name} ищет дом` : "Собака ищет дом" };
}

export default async function AdoptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const adopted = listing.status === "adopted";
  const districtName = listing.district
    ? findDistrict(listing.district)?.name
    : null;
  const sizeLabel =
    sizeOptions.find((o) => o.value === listing.size)?.label ?? null;
  const phone = listing.contactPhone?.replace(/[^\d+]/g, "");
  const telegram = listing.contactTelegram?.replace(/^@/, "");

  // Досье собаки — показываем только заполненные поля.
  const facts = [
    { label: "Порода", value: listing.breed },
    { label: "Возраст", value: listing.age },
    { label: "Размер", value: sizeLabel },
    { label: "Окрас", value: listing.color },
    { label: "Район", value: districtName },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/adoption"
        className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep transition hover:text-petal"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Ко всем собакам
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
        {/* Фото — клик открывает оригинал целиком в лайтбоксе */}
        <div>
          {listing.photo ? (
            <PhotoLightbox
              src={listing.photo}
              alt={`${listing.name}${listing.breed ? ` · ${listing.breed}` : ""}`}
              className="relative block aspect-square w-full overflow-hidden rounded-3xl border border-blush bg-blush-soft shadow-card"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-3xl border border-blush bg-blush-soft shadow-card">
              <div className="relative size-40 sm:size-52">
                <Image
                  src="/shunya/sm/pose-happy.png"
                  alt="Шуня"
                  fill
                  sizes="208px"
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Досье и контакты */}
        <div className="flex flex-col gap-5">
          <div>
            {adopted ? (
              <Badge tone="found">💞 Дома</Badge>
            ) : (
              <Badge tone="paw">🏠 Ищет дом</Badge>
            )}
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              {listing.name}
            </h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-soft">
              <Clock className="size-4 text-petal" aria-hidden />
              Анкета размещена {timeAgo(listing.createdAt)}
            </p>
          </div>

          {facts.length ? (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 rounded-3xl border border-blush bg-card p-5 shadow-card sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label} className="flex items-baseline gap-2">
                  <dt className="shrink-0 text-sm text-ink-soft">{f.label}:</dt>
                  <dd className="text-sm font-semibold text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {listing.story ? (
            <div>
              <h2 className="text-lg font-bold text-ink">О собаке</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink">
                {listing.story}
              </p>
            </div>
          ) : null}

          {phone || telegram ? (
            <div className="rounded-3xl bg-blush-soft p-5">
              <p className="text-sm font-bold text-ink">
                {listing.contactName
                  ? `${listing.contactName} ищет дом для ${listing.name}:`
                  : "Хотите забрать — свяжитесь:"}
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
                  >
                    <Phone className="size-4" aria-hidden />
                    {listing.contactPhone}
                  </a>
                ) : null}
                {telegram ? (
                  <a
                    href={`https://t.me/${telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
                  >
                    <Send className="size-4" aria-hidden />
                    {listing.contactTelegram}
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
              <PawPrint className="size-4 text-petal" aria-hidden />
              Контакты не указаны — следите за лентой пристройства.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <ShareButton
              path={`/adoption/${listing.id}`}
              title={`${listing.name} ищет дом`}
              text={`${listing.name} ищет дом и заботливого человека — посмотри анкету на «Лапке помощи».`}
            />
            <ButtonLink href="/adoption" variant="secondary">
              Все собаки
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <ShunyaBubble
          src="/shunya/sm/pose-happy.png"
          message="Забирая из приюта — спасаешь две жизни: этой собаке даёшь дом, а её место освобождается для следующей."
        />
      </div>
    </Container>
  );
}
