import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, Clock, MapPin, Phone, Search, Send } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { FoundSubscribeButton } from "@/components/found/FoundSubscribeButton";
import { ShareButton } from "@/components/share/ShareButton";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";
import { sizeOptions } from "@/lib/petForm";

// Статус и контакты нашедшего могут меняться — всегда свежие данные.
export const dynamic = "force-dynamic";

// Дедуп выборки между generateMetadata и страницей (один запрос вместо двух).
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
  if (!item) return { title: "Находка" };

  const districtName = item.district ? findDistrict(item.district)?.name : null;
  const title =
    item.status === "reunited"
      ? "Собака уже дома — воссоединились"
      : "Найдена собака — ищем хозяев";
  const description =
    [
      [item.breed, item.color].filter(Boolean).join(", ") || null,
      districtName ? `район ${districtName}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Узнали собаку? Помогите вернуть её домой.";

  return { title, description };
}

export default async function FoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getFound(id);
  if (!item) notFound();

  const districtName = item.district ? findDistrict(item.district)?.name : null;
  const sizeLabel = sizeOptions.find((o) => o.value === item.size)?.label ?? null;
  const facts = [item.breed, item.color, sizeLabel].filter(Boolean) as string[];
  const headline = facts.length ? facts.join(" · ") : "Найдена собака";
  const isReunited = item.status === "reunited";
  const phone = item.contactPhone?.replace(/[^\d+]/g, "");
  const telegram = item.contactTelegram?.replace(/^@/, "");

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/found"
        className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep transition hover:text-petal"
      >
        <ArrowLeft className="size-4" aria-hidden />
        К находкам
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        {/* Фото: клик открывает полноэкранный просмотр (оригинал без кропа) */}
        {item.photo ? (
          <PhotoLightbox
            src={item.photo}
            alt={`Найденная собака${item.breed ? ` · ${item.breed}` : ""}`}
            className="relative block aspect-square w-full overflow-hidden rounded-3xl border border-blush bg-blush-soft shadow-card"
          />
        ) : (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-3xl border border-blush bg-blush-soft p-6 text-center shadow-card">
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
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <Badge tone="found">
              {isReunited ? "💚 Воссоединились" : "🔎 Ищем хозяина"}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold sm:text-4xl">{headline}</h1>

          <div className="space-y-2.5">
            {districtName ? (
              <p className="flex items-center gap-2.5 text-sm text-ink-soft">
                <MapPin className="size-4 shrink-0 text-petal" aria-hidden />
                Район: <span className="font-semibold text-ink">{districtName}</span>
              </p>
            ) : null}
            <p className="flex items-center gap-2.5 text-sm text-ink-soft">
              <Clock className="size-4 shrink-0 text-petal" aria-hidden />
              Найдена <span className="font-semibold text-ink">{timeAgo(item.createdAt)}</span>
            </p>
          </div>

          {item.comment ? (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
                Что рассказал нашедший
              </h2>
              <p className="mt-1.5 leading-relaxed text-ink">{item.comment}</p>
            </div>
          ) : null}

          {/* Контакты нашедшего — главный путь воссоединения */}
          {phone || telegram ? (
            <div className="rounded-2xl bg-blush-soft p-4">
              <p className="text-sm font-bold text-ink">
                {item.finderName
                  ? `${item.finderName} нашёл(ла) — свяжитесь:`
                  : "Нашли — свяжитесь:"}
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-2 font-semibold text-petal-deep hover:underline"
                  >
                    <Phone className="size-4" aria-hidden />
                    {item.contactPhone}
                  </a>
                ) : null}
                {telegram ? (
                  <a
                    href={`https://t.me/${telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-petal-deep hover:underline"
                  >
                    <Send className="size-4" aria-hidden />
                    {item.contactTelegram}
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              Контакты не указаны — подпишитесь на находку и следите за
              обновлениями.
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <FoundSubscribeButton foundId={item.id} />
            <ShareButton
              path={`/found/${item.id}`}
              title={
                isReunited
                  ? "Собака уже дома — воссоединились"
                  : "Найдена собака — ищем хозяев"
              }
              text={`${headline}${
                districtName ? ` · район ${districtName}` : ""
              }. Узнали? Помогите вернуть её домой!`}
            />
            <ButtonLink variant="secondary" href="/feed/lost">
              <Search className="size-4" aria-hidden />
              Активные поиски рядом
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <ShunyaBubble
          src="/shunya/pose-happy.png"
          message="Узнали собаку? Свяжитесь с нашедшим — и подскажите хозяину, если знаете его. Вместе вернём хвостика домой! 🐾"
        />
      </div>
    </Container>
  );
}
