import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Camera, MapPin, Phone, Send, PawPrint, ShieldAlert, ScanLine, QrCode } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { findDistrict } from "@/lib/districts";
import { ageOptions, sizeOptions } from "@/lib/petForm";
import { ShareButton } from "@/components/share/ShareButton";
import { MessengerShare } from "@/components/share/MessengerShare";
import { PetGallery } from "@/components/pets/PetGallery";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleLd, breadcrumbLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

// React cache() дедуплицирует выборку: generateMetadata и сама страница
// вызывают getPet с тем же id в одном рендере → один запрос вместо двух.
const getPet = cache((id: string) =>
  db.pet.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } } },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPet(id);

  const metadataBase = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002",
  );

  // Питомец не найден — оставляем дефолтный заголовок без OG-карточки.
  if (!pet) {
    return { metadataBase, title: "Паспорт питомца" };
  }

  const districtName = pet.district ? findDistrict(pet.district)?.name : null;
  const isLost = pet.status === "lost";

  const title = isLost
    ? `🆘 Разыскивается: ${pet.name}`
    : `Паспорт · ${pet.name}`;
  const description = isLost
    ? `${[pet.breed, districtName]
        .filter(Boolean)
        .join(", ")}. Помогите вернуть домой — поделитесь!`
    : `${[pet.breed, districtName]
        .filter(Boolean)
        .join(", ")} · Цифровой паспорт питомца «Лапка помощи».`;
  // og:image отдаётся динамической карточкой opengraph-image.tsx (Next подставит
  // её автоматически в openGraph и twitter).
  return {
    metadataBase,
    title,
    description,
    alternates: { canonical: `/p/${id}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/p/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const statusMap: Record<string, { label: string; tone: "found" | "lost" | "neutral" }> = {
  home: { label: "Дома", tone: "neutral" },
  lost: { label: "Потерялась", tone: "lost" },
  found: { label: "Найдена", tone: "found" },
};

export default async function PassportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getPet(id);
  if (!pet) notFound();

  const marks: string[] = JSON.parse(pet.marks || "[]");
  const temperament: string[] = JSON.parse(pet.temperament || "[]");
  const district = pet.district ? findDistrict(pet.district)?.name : null;
  const sexLabel =
    pet.sex === "male" ? "Мальчик" : pet.sex === "female" ? "Девочка" : null;
  const ageLabel = ageOptions.find((o) => o.value === pet.age)?.label ?? null;
  const sizeLabel = sizeOptions.find((o) => o.value === pet.size)?.label ?? null;
  const status = statusMap[pet.status] ?? statusMap.home;

  const facts = [
    pet.breed,
    sexLabel,
    ageLabel,
    sizeLabel,
    pet.color,
  ].filter(Boolean) as string[];

  // Структурированные данные паспорта (третий публичный тип контента после
  // пропаж/находок) — общий билдер Article.
  const passportLd = articleLd({
    headline:
      pet.status === "lost"
        ? `🆘 Разыскивается: ${pet.name}`
        : `Паспорт питомца: ${pet.name}`,
    description: facts.join(", ") || "Цифровой паспорт питомца — Лапка помощи.",
    imagePath: `/p/${pet.id}/opengraph-image`,
    urlPath: `/p/${pet.id}`,
    datePublished: pet.createdAt,
    districtName: district,
  });
  const crumbItems = [
    { name: "Главная", path: "/" },
    { name: pet.name, path: `/p/${pet.id}` },
  ];
  const crumbs = breadcrumbLd(crumbItems);

  return (
    <Container className="py-12 sm:py-16">
      <JsonLd data={passportLd} />
      <JsonLd data={crumbs} />
      <div className="mx-auto max-w-2xl">
        <Breadcrumbs items={crumbItems} />
        <p className="mb-4 mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <PawPrint className="size-4 text-petal" aria-hidden />
          Цифровой паспорт · Лапка помощи
        </p>

        {pet.status === "lost" ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-status-lost/12 px-5 py-4 text-status-lost">
            <ShieldAlert className="size-6 shrink-0" aria-hidden />
            <p className="font-bold">
              Этот питомец в розыске! Если вы его видели — свяжитесь с хозяином.
            </p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-blush bg-card shadow-card">
          <div className="grid gap-0 sm:grid-cols-[minmax(0,20rem)_1fr]">
            <div className="relative aspect-square bg-blush-soft sm:aspect-auto sm:min-h-[20rem]">
              {pet.photo ? (
                <PhotoLightbox
                  src={pet.photo}
                  alt={`Фото питомца ${pet.name}`}
                  className="relative block size-full"
                  imgClassName="size-full object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="relative size-28 sm:size-32">
                    <Image
                      src="/shunya/pose-surprised-cut.png"
                      alt="Шуня ищет фото"
                      fill
                      sizes="128px"
                      className="object-contain"
                    />
                  </div>
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep">
                    <Camera className="size-4" aria-hidden />
                    Фото не добавлено
                  </p>
                  <p className="max-w-[14rem] text-xs leading-relaxed text-ink-soft">
                    По фото собаку узнают быстрее всего
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold">{pet.name}</h1>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>

              {facts.length ? (
                <p className="text-ink-soft">{facts.join(" · ")}</p>
              ) : null}

              {/* Репост паспорта — главный виральный канал поиска (ТЗ) */}
              <ShareButton
                path={`/p/${pet.id}`}
                title={
                  pet.status === "lost"
                    ? `🆘 Разыскивается: ${pet.name}`
                    : `Паспорт · ${pet.name}`
                }
                text={
                  pet.status === "lost"
                    ? `Помогите найти ${pet.name}!${
                        district ? ` Район: ${district}.` : ""
                      } Поделитесь паспортом.`
                    : `Цифровой паспорт питомца ${pet.name} · Лапка помощи`
                }
              />

              {/* Превентивная QR-бирка на ошейник: печать → паспорт по скану. */}
              <ButtonLink
                variant="secondary"
                size="sm"
                href={`/p/${pet.id}/card`}
                className="self-start"
              >
                <QrCode className="size-4" aria-hidden />
                QR-бирка на ошейник
              </ButtonLink>

              {pet.status === "lost" ? (
                <MessengerShare
                  path={`/p/${pet.id}`}
                  text={`Помогите найти ${pet.name}!${
                    district ? ` Район: ${district}.` : ""
                  } Поделитесь паспортом.`}
                />
              ) : null}

              {district ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                  <MapPin className="size-4 text-petal" aria-hidden />
                  Район: {district}
                </p>
              ) : null}

              {pet.chip ? (
                <div className="text-sm text-ink-soft">
                  <p className="inline-flex items-center gap-1.5">
                    <ScanLine className="size-4 text-petal" aria-hidden />
                    Микрочип: <span className="font-mono">{pet.chip}</span>
                  </p>
                  {/* Нашедший может сразу пробить чип в национальных реестрах. */}
                  <p className="mt-1 text-xs">
                    Проверить в реестре:{" "}
                    <a
                      href="https://www.animal-id.ru/search/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-petal-deep hover:underline"
                    >
                      Animal-ID.RU
                    </a>
                    {" · "}
                    <a
                      href="https://animalface.ru/search/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-petal-deep hover:underline"
                    >
                      AnimalFace
                    </a>
                  </p>
                </div>
              ) : null}

              {marks.length || pet.marksText ? (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
                    Особые приметы
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {marks.map((m) => (
                      <Badge key={m} tone="petal">
                        {m}
                      </Badge>
                    ))}
                  </div>
                  {pet.marksText ? (
                    <p className="mt-2 text-sm text-ink">{pet.marksText}</p>
                  ) : null}
                </div>
              ) : null}

              {temperament.length ? (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
                    Характер
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {temperament.map((t) => (
                      <Badge key={t} tone="neutral">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Контакты — только с согласия владельца (ТЗ) */}
              {pet.showPhone && (pet.ownerPhone || pet.telegram) ? (
                <div className="mt-2 rounded-2xl bg-blush-soft p-4">
                  <h2 className="text-sm font-bold text-ink">Нашли? Свяжитесь:</h2>
                  <div className="mt-2 flex flex-col gap-2">
                    {pet.ownerPhone ? (
                      <a
                        href={`tel:${pet.ownerPhone.replace(/[^\d+]/g, "")}`}
                        className="inline-flex items-center gap-2 font-semibold text-petal-deep hover:underline"
                      >
                        <Phone className="size-4" aria-hidden />
                        {pet.ownerPhone}
                      </a>
                    ) : null}
                    {pet.telegram ? (
                      <a
                        href={`https://t.me/${pet.telegram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-semibold text-petal-deep hover:underline"
                      >
                        <Send className="size-4" aria-hidden />
                        {pet.telegram}
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-ink-soft">
                  Контакты скрыты владельцем. Сообщите о находке через приложение
                  «Лапка помощи».
                </p>
              )}
            </div>
          </div>
        </div>

        {pet.photos.length ? (
          <div className="mx-auto mt-6 max-w-2xl">
            <PetGallery
              photos={pet.photos.map((p) => ({ id: p.id, url: p.url }))}
              petName={pet.name}
            />
          </div>
        ) : null}
      </div>
    </Container>
  );
}
