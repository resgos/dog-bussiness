import { cache } from "react";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
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
} from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { SubscribeButton } from "@/components/feed/SubscribeButton";
import { ShareButton } from "@/components/share/ShareButton";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";
import { sizeOptions } from "@/lib/petForm";

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

  return { title, description };
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

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/feed/lost"
        className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep transition hover:text-petal"
      >
        <ArrowLeft className="size-4" aria-hidden />
        В ленту
      </Link>

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

          {report.comment ? (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
                Комментарий хозяина
              </h2>
              <p className="mt-1.5 leading-relaxed text-ink">{report.comment}</p>
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {report.status === "active" ? (
              <SubscribeButton reportId={report.id} />
            ) : null}
            <ButtonLink href={`/poster/${report.id}`}>
              <Printer className="size-4" aria-hidden />
              Розыскной плакат
            </ButtonLink>
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
            <ButtonLink variant="secondary" href="/map">
              <MapIcon className="size-4" aria-hidden />
              На карту поиска
            </ButtonLink>
          </div>
        </div>
      </div>

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
    </Container>
  );
}
