import Image from "next/image";
import Link from "next/link";
import { MapPin, PawPrint, Phone, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";
import { sizeOptions } from "@/lib/petForm";

export type AdoptionItem = {
  id: string;
  name: string;
  breed: string | null;
  age: string | null;
  size: string | null;
  color: string | null;
  photo: string | null;
  district: string | null;
  story: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactTelegram: string | null;
  createdAt: string | Date;
};

/** Карточка собаки на пристройство: ищет дом и заботливого хозяина. */
export function AdoptionCard({ item }: { item: AdoptionItem }) {
  const districtName = item.district ? findDistrict(item.district)?.name : null;
  const sizeLabel = sizeOptions.find((o) => o.value === item.size)?.label ?? null;
  const facts = [item.breed, item.age, sizeLabel].filter(Boolean) as string[];
  const phone = item.contactPhone?.replace(/[^\d+]/g, "");
  const telegram = item.contactTelegram?.replace(/^@/, "");

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-blush bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[4/3] bg-blush-soft">
        {item.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.photo}
            alt={`${item.name}${item.breed ? ` · ${item.breed}` : ""}`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center p-6">
            <div className="relative size-28">
              <Image
                src="/shunya/pose-happy-cut.png"
                alt="Шуня"
                fill
                sizes="112px"
                className="object-contain"
              />
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge tone="petal">🏠 Ищет дом</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-bold text-ink">{item.name}</h3>
          {facts.length ? (
            <p className="mt-0.5 text-sm text-ink-soft">{facts.join(" · ")}</p>
          ) : null}
          <p className="mt-1 text-xs text-ink-soft">{timeAgo(item.createdAt)}</p>
        </div>

        {item.color ? (
          <p className="text-sm text-ink-soft">Окрас: {item.color}</p>
        ) : null}

        {districtName ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin className="size-4 text-petal" aria-hidden />
            Район: {districtName}
          </p>
        ) : null}

        {item.story ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-ink">
            {item.story}
          </p>
        ) : null}

        {phone || telegram ? (
          <div className="mt-auto rounded-2xl bg-blush-soft p-3.5">
            <p className="text-xs font-bold text-ink">
              {item.contactName
                ? `${item.contactName} ищет дом для ${item.name}:`
                : "Хотите забрать — свяжитесь:"}
            </p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="relative z-10 inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
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
                  className="relative z-10 inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
                >
                  <Send className="size-4" aria-hidden />
                  {item.contactTelegram}
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-auto inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <PawPrint className="size-3.5 text-petal" aria-hidden />
            Контакты не указаны — следите за лентой пристройства.
          </p>
        )}
      </div>

      {/* Вся карточка кликабельна — ссылка-растяжка последней, чтобы перекрыть
          relative-обёртку фото; контактам выше задан z-10. */}
      <Link
        href={`/adoption/${item.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Подробнее: ${item.name} ищет дом`}
      >
        <span className="sr-only">Подробнее</span>
      </Link>
    </article>
  );
}
