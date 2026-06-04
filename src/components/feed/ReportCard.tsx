import Image from "next/image";
import { Camera, Clock, Eye, MapPin } from "lucide-react";
import { findDistrict } from "@/lib/districts";
import { timeAgo, plural } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { FoundButton } from "./FoundButton";

type ReportLite = {
  id: string;
  petName: string;
  breed: string | null;
  photo: string | null;
  district: string | null;
  lostAt: Date | string | null;
  comment: string | null;
  radiusKm: number;
  status: string;
  createdAt: Date | string;
  sightings: { id: string }[];
};

export function ReportCard({ report }: { report: ReportLite }) {
  const district = report.district ? findDistrict(report.district)?.name : null;
  const when = report.lostAt ?? report.createdAt;
  const isFound = report.status === "found";
  const sCount = report.sightings.length;

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-blush bg-card shadow-card">
      <div className="relative aspect-[4/3] bg-blush-soft">
        {report.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={report.photo} alt={`Фото питомца ${report.petName}`} className="size-full object-cover" />
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
        <span className="absolute left-3 top-3">
          <Badge tone={isFound ? "found" : "lost"}>
            {isFound ? "Найдена" : "Активный поиск"}
          </Badge>
        </span>
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
          {!isFound ? <FoundButton id={report.id} /> : null}
        </div>
      </div>
    </article>
  );
}
