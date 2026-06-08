import type { ComponentType } from "react";
import {
  Dog,
  Globe,
  Hotel,
  MapPin,
  Phone,
  Scissors,
  ShoppingBag,
  Stethoscope,
  type LucideProps,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { findDistrict } from "@/lib/districts";

export type Partner = {
  id: string;
  name: string;
  type: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  url: string | null;
  description: string | null;
};

type Tone = "neutral" | "petal" | "paw" | "found" | "seen";

/** Внешний вид типа партнёра: иконка + подпись + тон бейджа. */
type TypeMeta = {
  label: string;
  icon: ComponentType<LucideProps>;
  tone: Tone;
};

export const partnerTypes: Record<string, TypeMeta> = {
  vet: { label: "Ветклиника", icon: Stethoscope, tone: "seen" },
  groomer: { label: "Груминг", icon: Scissors, tone: "petal" },
  hotel: { label: "Передержка", icon: Hotel, tone: "paw" },
  trainer: { label: "Кинолог", icon: Dog, tone: "found" },
  shop: { label: "Зоотовары", icon: ShoppingBag, tone: "neutral" },
};

const fallbackMeta: TypeMeta = {
  label: "Сервис",
  icon: Dog,
  tone: "neutral",
};

/** Карточка проверенного партнёра-сервиса рядом (ветклиника, груминг и т.д.). */
export function PartnerCard({ partner }: { partner: Partner }) {
  const meta = partnerTypes[partner.type] ?? fallbackMeta;
  const Icon = meta.icon;
  const districtName = partner.district
    ? findDistrict(partner.district)?.name
    : null;
  const phone = partner.phone?.replace(/[^\d+]/g, "");

  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-blush bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blush-soft text-petal-deep">
          <Icon className="size-6" aria-hidden />
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div>
        <h3 className="text-lg font-bold text-ink">{partner.name}</h3>
        {districtName ? (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin className="size-4 text-petal" aria-hidden />
            {districtName}
          </p>
        ) : null}
      </div>

      {partner.address ? (
        <p className="text-sm text-ink-soft">{partner.address}</p>
      ) : null}

      {partner.description ? (
        <p className="text-sm leading-relaxed text-ink">{partner.description}</p>
      ) : null}

      {phone || partner.url ? (
        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
            >
              <Phone className="size-4" aria-hidden />
              {partner.phone}
            </a>
          ) : null}
          {partner.url ? (
            <a
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 truncate text-sm font-semibold text-petal-deep hover:underline"
            >
              <Globe className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Сайт партнёра</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
