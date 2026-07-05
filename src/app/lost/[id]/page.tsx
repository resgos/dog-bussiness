import { cache } from "react";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Camera,
  Clock,
  Eye,
  Gift,
  Map as MapIcon,
  MapPin,
  Palette,
  PawPrint,
  Printer,
  Ruler,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { SubscribeButton } from "@/components/feed/SubscribeButton";
import { ShareButton } from "@/components/share/ShareButton";
import { MessengerShare } from "@/components/share/MessengerShare";
import { DonateReward } from "@/components/boost/DonateReward";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";
import { rankFoundForLost, ONPAGE_MATCH_MIN } from "@/lib/match";
import { sizeOptions } from "@/lib/petForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleLd, breadcrumbLd } from "@/lib/seo";

// Статус и наблюдения меняются в реальном времени — всегда свежие данные.
export const dynamic = "force-dynamic";

// Дедуп выборки между generateMetadata и страницей (один запрос вместо двух).
const getReport = cache((id: string) =>
  db.lostReport.findUnique({
    where: { id },
    include: { sightings: { orderBy: { createdAt: "desc" } } },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return { title: "Объявление о пропаже" };

  const districtName = report.district
    ? findDistrict(report.district)?.name
    : null;
  const title =
    report.status === "found"
      ? `${report.petName} — найдена`
      : `🆘 ${report.petName} — розыск`;
  const description =
    [report.breed, districtName ? `район ${districtName}` : null]
      .filter(Boolean)
      .join(", ") || "Помогите вернуть собаку домой — Лапка помощи.";

  // og:image отдаётся динамической карточкой opengraph-image.tsx (Next сам
  // подставит её в openGraph.images и twitter.images).
  return {
    title,
    description,
    alternates: { canonical: `/lost/${id}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const statusMap: Record<
  string,
  { label: string; tone: "lost" | "found" | "neutral" }
> = {
  active: { label: "Активный поиск", tone: "lost" },
  found: { label: "Найдена", tone: "found" },
  home: { label: "Снят", tone: "neutral" },
};

/** Строка фактов «иконка · подпись · значение» в правой колонке. */
function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-petal" aria-hidden />
      <p className="text-sm leading-relaxed">
        <span className="text-ink-soft">{label}: </span>
        <span className="font-semibold text-ink">{children}</span>
      </p>
    </div>
  );
}

export default async function LostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  // «Награда от соседей»: пул донатов района + статус входа для моста.
  const me = await getCurrentUser().catch(() => null);
  const donated = await db.purchase.aggregate({
    where: { kind: "reward-donation", refId: id },
    _sum: { amountRub: true },
  });
  const donatedRub = donated._sum.amountRub ?? 0;

  const districtName = report.district
    ? findDistrict(report.district)?.name
    : null;
  const sizeLabel =
    sizeOptions.find((o) => o.value === report.size)?.label ?? null;
  const status = statusMap[report.status] ?? statusMap.active;
  const isFound = report.status === "found";
  // Платное продвижение активно, пока boostedUntil в будущем.
  const isBoosted = report.boostedUntil
    ? new Date(report.boostedUntil).getTime() > Date.now()
    : false;
  const sightings = report.sightings;

  // «Похожие находки»: матчим активную пропажу против открытых находок
  // (приметы + photoHash, без тяжёлых фото), фото дотягиваем только для топ-3.
  let matches: {
    id: string;
    score: number;
    photo: string | null;
    breed: string | null;
    color: string | null;
    district: string | null;
    createdAt: Date;
  }[] = [];
  if (report.status === "active") {
    const founds = await db.foundReport.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        breed: true,
        color: true,
        size: true,
        district: true,
        photoHash: true,
        createdAt: true,
      },
    });
    const top = rankFoundForLost(report, founds, ONPAGE_MATCH_MIN).slice(0, 3);
    if (top.length) {
      const photos = await db.foundReport.findMany({
        where: { id: { in: top.map((m) => m.item.id) } },
        select: { id: true, photo: true },
      });
      const photoById = new Map(photos.map((p) => [p.id, p.photo]));
      matches = top.map(({ item, score }) => ({
        id: item.id,
        score,
        photo: photoById.get(item.id) ?? null,
        breed: item.breed,
        color: item.color,
        district: item.district,
        createdAt: item.createdAt,
      }));
    }
  }

  // «Ещё ищут рядом»: другие активные розыски того же района (Meteora-style
  // related). Больше глаз на район — выше шанс у каждой собаки. Без миграций.
  const nearby = report.district
    ? await db.lostReport.findMany({
        where: {
          status: "active",
          district: report.district,
          id: { not: report.id },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, petName: true, photo: true, breed: true, createdAt: true },
      })
    : [];

  // Структурированные данные (schema.org Article) для богатых результатов Google.
  const jsonLd = articleLd({
    headline: isFound
      ? `${report.petName} — найдена`
      : `🆘 Разыскивается: ${report.petName}`,
    description:
      [report.breed, districtName ? `район ${districtName}` : null]
        .filter(Boolean)
        .join(", ") || "Помогите вернуть собаку домой — Лапка помощи.",
    imagePath: `/lost/${report.id}/opengraph-image`,
    urlPath: `/lost/${report.id}`,
    datePublished: report.lostAt ?? report.createdAt,
    dateModified: report.createdAt,
    districtName,
  });
  const crumbItems = [
    { name: "Главная", path: "/" },
    { name: "Лента розыска", path: "/feed/lost" },
    { name: report.petName, path: `/lost/${report.id}` },
  ];
  const crumbs = breadcrumbLd(crumbItems);

  return (
    <Container className="py-12 sm:py-16">
      <JsonLd data={jsonLd} />
      <JsonLd data={crumbs} />
      <Breadcrumbs items={crumbItems} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        {/* Фото: клик открывает полноэкранный просмотр (оригинал без кропа) */}
        {report.photo ? (
          <PhotoLightbox
            src={report.photo}
            alt={`Фото питомца ${report.petName}`}
            className="relative block aspect-square w-full overflow-hidden rounded-3xl border border-blush bg-blush-soft shadow-card"
          />
        ) : (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-3xl border border-blush bg-blush-soft p-6 text-center shadow-card">
            <div className="relative size-28 sm:size-32">
              <Image
                src="/shunya/sm/pose-surprised.png"
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {isBoosted ? <Badge tone="paw">🚀 Продвигается</Badge> : null}
          </div>

          <h1 className="text-3xl font-bold sm:text-4xl">{report.petName}</h1>

          <div className="space-y-2.5">
            {report.breed ? (
              <Fact icon={PawPrint} label="Порода">
                {report.breed}
              </Fact>
            ) : null}
            {sizeLabel ? (
              <Fact icon={Ruler} label="Размер">
                {sizeLabel}
              </Fact>
            ) : null}
            {report.color ? (
              <Fact icon={Palette} label="Окрас">
                {report.color}
              </Fact>
            ) : null}
            {districtName ? (
              <Fact icon={MapPin} label="Район">
                {districtName} · радиус {report.radiusKm} км
              </Fact>
            ) : null}
            <Fact icon={Clock} label="Пропала">
              {timeAgo(report.lostAt ?? report.createdAt)}
            </Fact>
          </div>

          {/* Иерархия действий по ролям (дизайн-критика №2): главный гость
              страницы — НАШЕДШИЙ, его действие первое и акцентное. */}
          {report.status === "active" ? (
            <div className="rounded-2xl border-2 border-petal/60 bg-blush-soft/70 p-4">
              <p className="font-bold text-ink">{`Видели ${report.petName}?`}</p>
              <p className="mt-1 text-sm text-ink-soft">
                Отметьте место и время на карте — хозяин сразу получит сигнал.
              </p>
              <ButtonLink
                href={`/map?report=${report.id}&see=1`}
                size="lg"
                className="mt-3"
              >
                <Eye className="size-5" aria-hidden />
                Я видел эту собаку
              </ButtonLink>
            </div>
          ) : null}

          {report.reward ? (
            <div className="rounded-2xl bg-paw/25 p-4">
              <p className="inline-flex items-center gap-2 font-bold text-ink">
                <Gift className="size-5 text-petal-deep" aria-hidden />
                Награда {report.reward.toLocaleString("ru-RU")} ₽
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-status-lost">
                ⚠️ Не переводите предоплату за «возврат» — это частая схема
                мошенников. Награду отдавайте лично после встречи с собакой.
              </p>
            </div>
          ) : null}

          {/* Краудфандинг награды: соседи скидываются на поиск (P1 #4). */}
          <DonateReward
            reportId={report.id}
            initialTotal={donatedRub}
            isAuthed={Boolean(me)}
            active={report.status === "active"}
          />

          {report.comment ? (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
                Комментарий хозяина
              </h2>
              <p className="mt-1.5 leading-relaxed text-ink">{report.comment}</p>
            </div>
          ) : null}

          {/* Роль «сочувствующий сосед»: репост — главный вклад без выхода из
              дома. Кнопка «Поделиться» и мессенджеры сгруппированы вместе. */}
          <div className="rounded-2xl bg-blush-soft/50 p-4">
            <p className="text-sm font-bold text-ink">
              {isFound ? "Поделитесь радостью" : "Помочь поиску за 10 секунд"}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <ShareButton
                path={`/lost/${report.id}`}
                title={
                  isFound
                    ? `${report.petName} — найдена!`
                    : `🆘 Разыскивается: ${report.petName}`
                }
                text={
                  isFound
                    ? `${report.petName} уже дома — спасибо всем, кто помогал искать!`
                    : `Помогите найти ${report.petName}!${
                        districtName ? ` Район: ${districtName}.` : ""
                      } Каждый репост приближает встречу.`
                }
              />
              {report.status === "active" ? (
                <MessengerShare
                  path={`/lost/${report.id}`}
                  text={`Помогите найти ${report.petName}!${
                    districtName ? ` Район: ${districtName}.` : ""
                  } Каждый репост приближает встречу.`}
                />
              ) : null}
            </div>
          </div>

          {/* Сервисный ряд — вторичные действия, не конкурируют с главными. */}
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {report.status === "active" ? (
              <SubscribeButton reportId={report.id} />
            ) : null}
            <ButtonLink variant="secondary" href={`/poster/${report.id}`}>
              <Printer className="size-4" aria-hidden />
              Розыскной плакат
            </ButtonLink>
            <ButtonLink variant="secondary" href={`/map?report=${report.id}`}>
              <MapIcon className="size-4" aria-hidden />
              На карту поиска
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Похожие находки: движок матчинга прямо на странице розыска */}
      {matches.length > 0 ? (
        <section className="mt-10 sm:mt-12">
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="size-6 text-petal" aria-hidden />
            Похожие находки
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Открытые находки, совпадающие по приметам. Узнали {report.petName}?
            Откройте и свяжитесь с нашедшим.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => {
              const place = m.district ? findDistrict(m.district)?.name : null;
              const facts =
                [m.breed, m.color].filter(Boolean).join(" · ") ||
                "Найдена собака";
              return (
                <Link
                  key={m.id}
                  href={`/found/${m.id}`}
                  className="group flex items-center gap-4 rounded-3xl border border-blush bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
                >
                  <span className="relative block size-20 shrink-0 overflow-hidden rounded-2xl bg-blush-soft">
                    {m.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={m.photo}
                        alt={facts}
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
                      {facts}
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

      {/* Наблюдения соседей: свежие сверху */}
      <section className="mt-10 sm:mt-12">
        <h2 className="inline-flex items-center gap-2 text-2xl font-bold">
          <Eye className="size-6 text-petal" aria-hidden />
          Наблюдения ({sightings.length})
        </h2>

        {sightings.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-blush bg-card p-6 shadow-card">
            <p className="leading-relaxed text-ink-soft">
              Пока никто не видел {report.petName} — поделись объявлением, чтобы
              больше соседей включились в поиск. 🐾
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {sightings.map((s) => (
              <article
                key={s.id}
                className="rounded-3xl border border-blush bg-card p-5 shadow-card"
              >
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <Clock className="size-3.5" aria-hidden />
                  {timeAgo(s.createdAt)}
                </p>
                {s.comment ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    {s.comment}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-ink-soft">
                    Отметка на карте без комментария.
                  </p>
                )}
                {s.photo ? (
                  <PhotoLightbox
                    src={s.photo}
                    alt={`Фото наблюдения · ${report.petName}`}
                    className="relative mt-3 block aspect-video w-full max-w-xs overflow-hidden rounded-2xl border border-blush bg-blush-soft"
                  />
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {nearby.length > 0 ? (
        <section className="mt-10 sm:mt-12">
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold">
            <PawPrint className="size-6 text-petal" aria-hidden />
            Ещё ищут{districtName ? ` в районе ${districtName}` : " рядом"}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Другие активные розыски рядом — больше глаз на район, выше шанс у
            каждой собаки.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((n) => (
              <Link
                key={n.id}
                href={`/lost/${n.id}`}
                className="group flex items-center gap-4 rounded-3xl border border-blush bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
              >
                <span className="relative block size-16 shrink-0 overflow-hidden rounded-2xl bg-blush-soft">
                  {n.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={n.photo}
                      alt={`Разыскивается ${n.petName}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-petal">
                      <PawPrint className="size-7" aria-hidden />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-ink group-hover:text-petal-deep">
                    {n.petName}
                  </span>
                  <span className="block truncate text-sm text-ink-soft">
                    {[n.breed, timeAgo(n.createdAt)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          {report.district ? (
            <p className="mt-4 text-sm">
              <Link
                href={`/district/${report.district}`}
                className="font-semibold text-petal-deep hover:underline"
              >
                Все пропажи и находки района
                {districtName ? ` ${districtName}` : ""} →
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}
    </Container>
  );
}
