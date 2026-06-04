import Image from "next/image";
import { Camera, MapPin, Phone, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";
import { sizeOptions } from "@/lib/petForm";

export type FoundItem = {
  id: string;
  finderName: string | null;
  contactPhone: string | null;
  contactTelegram: string | null;
  photo: string | null;
  breed: string | null;
  color: string | null;
  size: string | null;
  district: string | null;
  comment: string | null;
  createdAt: string | Date;
};

/** Карточка находки: нашли чужую/бездомную собаку, ищем хозяина. */
export function FoundCard({ item }: { item: FoundItem }) {
  const districtName = item.district ? findDistrict(item.district)?.name : null;
  const sizeLabel = sizeOptions.find((o) => o.value === item.size)?.label ?? null;
  const facts = [item.breed, item.color, sizeLabel].filter(Boolean) as string[];
  const phone = item.contactPhone?.replace(/[^\d+]/g, "");
  const telegram = item.contactTelegram?.replace(/^@/, "");

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-blush bg-card shadow-card">
      <div className="relative aspect-[4/3] bg-blush-soft">
        {item.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.photo}
            alt={`Найденная собака${item.breed ? ` · ${item.breed}` : ""}`}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-5 text-center">
            <div className="relative size-20">
              <Image
                src="/shunya/pose-surprised-cut.png"
                alt="Шуня"
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-petal-deep">
              <Camera className="size-3.5" aria-hidden />
              Фото не добавлено
            </p>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge tone="found">🔎 Ищем хозяина</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-bold text-ink">
            {facts.length ? facts.join(" · ") : "Найдена собака"}
          </h3>
          <p className="mt-1 text-xs text-ink-soft">{timeAgo(item.createdAt)}</p>
        </div>

        {districtName ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin className="size-4 text-petal" aria-hidden />
            Район: {districtName}
          </p>
        ) : null}

        {item.comment ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-ink">
            {item.comment}
          </p>
        ) : null}

        {phone || telegram ? (
          <div className="mt-auto rounded-2xl bg-blush-soft p-3.5">
            <p className="text-xs font-bold text-ink">
              {item.finderName ? `${item.finderName} нашёл(ла):` : "Нашли — свяжитесь:"}
            </p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
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
                  className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
                >
                  <Send className="size-4" aria-hidden />
                  {item.contactTelegram}
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-auto text-xs text-ink-soft">
            Контакты не указаны — отслеживайте в ленте находок.
          </p>
        )}
      </div>
    </article>
  );
}
