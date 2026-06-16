import Image from "next/image";
import Link from "next/link";
import { Camera, Clock, Eye, MapPin, Printer } from "lucide-react";
import { findDistrict } from "@/lib/districts";
import { timeAgo, plural } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { FoundButton } from "./FoundButton";
import { SubscribeButton } from "./SubscribeButton";

type ReportLite = {
  id: string;
  petName: string;
  breed: string | null;
  photo: string | null;
  district: string | null;
  lostAt: Date | string | null;
  comment: string | null;
  radiusKm: number;
  reward: number | null;
  status: string;
  createdAt: Date | string;
  boostedUntil?: Date | string | null;
  sightings: { id: string }[];
};

export function ReportCard({ report }: { report: ReportLite }) {
  const district = report.district ? findDistrict(report.district)?.name : null;
  const when = report.lostAt ?? report.createdAt;
  const isFound = report.status === "found";
  const sCount = report.sightings.length;
  // Платное продвижение активно, пока boostedUntil в будущем.
  const isBoosted = report.boostedUntil
    ? new Date(report.boostedUntil).getTime() > Date.now()
    : false;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-blush bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[4/3] bg-blush-soft">
        {report.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={report.photo}
            alt={`Фото питомца ${report.petName}`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="relative size-20">
              <Image
                src="/shunya/pose-surprised-cut.png"
                alt="Шуня ищет фото"
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep">
              <Camera className="size-4" aria-hidden />
              Фото не добавлено
            </p>
          </div>
        )}
        <span className="absolute left-3 top-3 z-10">
          <Badge tone={isFound ? "found" : "lost"}>
            {isFound ? "Найдена" : "Активный поиск"}
          </Badge>
        </span>
        {/* Бейдж продвижения и награда живут в одной колонке справа — складываем
            их стопкой, чтобы не наезжали друг на друга. */}
        {isBoosted || report.reward ? (
          <span className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
            {isBoosted ? <Badge tone="paw">🚀 Продвигается</Badge> : null}
            {report.reward ? (
              <Badge tone="paw">🎁 {report.reward.toLocaleString("ru-RU")} ₽</Badge>
            ) : null}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold">{report.petName}</h3>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-soft">
            <Clock className="size-3.5" aria-hidden />
            {timeAgo(when)}
          </span>
        </div>

        <p className="text-sm text-ink-soft">{report.breed || "Порода не указана"}</p>

        {district ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin className="size-4 text-petal" aria-hidden />
            {district} · радиус {report.radiusKm} км
          </p>
        ) : null}

        {report.comment ? (
          <p className="text-sm leading-relaxed text-ink">{report.comment}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {sCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep">
              <Eye className="size-4" aria-hidden />
              {sCount} {plural(sCount, "наблюдение", "наблюдения", "наблюдений")}
            </span>
          ) : (
            <span className="text-sm text-ink-soft">Пока без наблюдений</span>
          )}
          {!isFound ? (
            <span className="relative z-10">
              <FoundButton id={report.id} />
            </span>
          ) : null}
        </div>

        {!isFound ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/poster/${report.id}`}
              className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
            >
              <Printer className="size-4" aria-hidden />
              Розыскной плакат
            </Link>
            <span className="relative z-10">
              <SubscribeButton reportId={report.id} />
            </span>
          </div>
        ) : null}
      </div>

      {/* Stretched link: вся карточка кликабельна и ведёт на детальную страницу.
          Идёт последним ребёнком, чтобы перекрывать positioned-блок фото
          (одинаковый stack level — побеждает порядок в DOM); интерактивные
          потомки подняты на z-10 и кликаются как раньше. */}
      <Link
        href={`/lost/${report.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Подробнее: ${report.petName}`}
      >
        <span className="sr-only">Подробнее</span>
      </Link>
    </article>
  );
}
