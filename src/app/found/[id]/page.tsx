import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Clock,
  MapPin,
  PawPrint,
  Phone,
  Printer,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { FoundSubscribeButton } from "@/components/found/FoundSubscribeButton";
import { FoundStatusButton } from "@/components/found/FoundStatusButton";
import { ShareButton } from "@/components/share/ShareButton";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";
import { rankLostForFound, ONPAGE_MATCH_MIN } from "@/lib/match";
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

  // og:image отдаётся динамической карточкой opengraph-image.tsx.
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getFound(id);
  if (!item) notFound();

  const me = await getCurrentUser().catch(() => null);
  const isOwner = Boolean(item.userId && me?.id === item.userId);

  const districtName = item.district ? findDistrict(item.district)?.name : null;
  const sizeLabel = sizeOptions.find((o) => o.value === item.size)?.label ?? null;
  const facts = [item.breed, item.color, sizeLabel].filter(Boolean) as string[];
  const headline = facts.length ? facts.join(" · ") : "Найдена собака";
  const isReunited = item.status === "reunited";
  const phone = item.contactPhone?.replace(/[^\d+]/g, "");
  const telegram = item.contactTelegram?.replace(/^@/, "");

  // «Похоже, её ищут»: матчим находку против активных пропаж (лёгкая выборка
  // без фото), фото дотягиваем только для топ-3.
  let matches: {
    id: string;
    score: number;
    petName: string;
    photo: string | null;
    district: string | null;
    createdAt: Date;
  }[] = [];
  if (!isReunited) {
    const losts = await db.lostReport.findMany({
      where: { status: "active" },
      select: {
        id: true,
        petName: true,
        breed: true,
        color: true,
        size: true,
        district: true,
        photoHash: true,
        lostAt: true,
        createdAt: true,
      },
    });
    const top = rankLostForFound(item, losts, ONPAGE_MATCH_MIN).slice(0, 3);
    if (top.length) {
      const photos = await db.lostReport.findMany({
        where: { id: { in: top.map((m) => m.item.id) } },
        select: { id: true, photo: true },
      });
      const photoById = new Map(photos.map((p) => [p.id, p.photo]));
      matches = top.map(({ item: l, score }) => ({
        id: l.id,
        score,
        petName: l.petName,
        photo: photoById.get(l.id) ?? null,
        district: l.district,
        createdAt: l.createdAt,
      }));
    }
  }

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
            {isOwner && !isReunited ? (
              <FoundStatusButton id={item.id} status={item.status} />
            ) : null}
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
            {!isReunited ? (
              <ButtonLink variant="secondary" href={`/found/${item.id}/poster`}>
                <Printer className="size-4" aria-hidden />
                Плакат «Найдена»
              </ButtonLink>
            ) : null}
            <ButtonLink variant="secondary" href="/feed/lost">
              <Search className="size-4" aria-hidden />
              Активные поиски рядом
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Похоже, её ищут: обратный матчинг находка → активные пропажи */}
      {matches.length > 0 ? (
        <section className="mt-10 sm:mt-12">
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="size-6 text-petal" aria-hidden />
            Похоже, её ищут
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Активные объявления о пропаже, совпадающие по приметам. Это может
            быть та самая собака.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => {
              const place = m.district ? findDistrict(m.district)?.name : null;
              return (
                <Link
                  key={m.id}
                  href={`/lost/${m.id}`}
                  className="group flex items-center gap-4 rounded-3xl border border-blush bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
                >
                  <span className="relative block size-20 shrink-0 overflow-hidden rounded-2xl bg-blush-soft">
                    {m.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={m.photo}
                        alt={`Разыскивается ${m.petName}`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-petal">
                        <PawPrint className="size-8" aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blush-soft px-2 py-0.5 text-xs font-bold text-petal-deep">
                      <Sparkles className="size-3" aria-hidden />
                      {m.score}% совпадение
                    </span>
                    <span className="mt-1 block truncate font-bold text-ink group-hover:text-petal-deep">
                      {m.petName}
                    </span>
                    <span className="block text-xs text-ink-soft">
                      {place ? `${place} · ` : ""}
                      {timeAgo(m.createdAt)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mt-10 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <ShunyaBubble
          src="/shunya/pose-happy.png"
          message="Узнали собаку? Свяжитесь с нашедшим — и подскажите хозяину, если знаете его. Вместе вернём хвостика домой! 🐾"
        />
      </div>
    </Container>
  );
}
