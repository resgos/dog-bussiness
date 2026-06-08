"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { TagToggle } from "@/components/ui/TagToggle";
import { districtsByOkrug } from "@/lib/districts";
import { PartnerCard, partnerTypes, type Partner } from "./PartnerCard";

/** Порядок типов в фильтре — клиники сначала, зоотовары в конце. */
const typeOrder = ["vet", "groomer", "hotel", "trainer", "shop"];

/** Каталог партнёров с фильтрами по типу и району (клиент). */
export function ServicesList({ items }: { items: Partner[] }) {
  const [type, setType] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);

  // Чипы типов — только те, что реально есть в данных, в заданном порядке.
  const presentTypes = useMemo(() => {
    const ids = new Set(items.map((i) => i.type));
    return typeOrder.filter((t) => ids.has(t) && partnerTypes[t]);
  }, [items]);

  // Чипы районов — только присутствующие, сгруппированы по округу.
  const presentDistricts = useMemo(() => {
    const ids = new Set(
      items.map((i) => i.district).filter(Boolean) as string[],
    );
    return Object.entries(districtsByOkrug())
      .map(([okrug, list]) => [okrug, list.filter((d) => ids.has(d.id))] as const)
      .filter(([, list]) => list.length > 0);
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (type && i.type !== type) return false;
      if (district && i.district !== district) return false;
      return true;
    });
  }, [items, type, district]);

  const hasFilters = Boolean(type || district);

  const reset = () => {
    setType(null);
    setDistrict(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-3xl border border-blush bg-card p-5 shadow-card sm:p-6">
        {presentTypes.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Тип сервиса</p>
            <div className="flex flex-wrap gap-2">
              <TagToggle active={type === null} onClick={() => setType(null)}>
                Все
              </TagToggle>
              {presentTypes.map((t) => (
                <TagToggle
                  key={t}
                  active={type === t}
                  onClick={() => setType(type === t ? null : t)}
                >
                  {partnerTypes[t].label}
                </TagToggle>
              ))}
            </div>
          </div>
        ) : null}

        {presentDistricts.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Район</p>
            <div className="flex flex-wrap gap-2">
              {presentDistricts.map(([okrug, list]) =>
                list.map((d) => (
                  <TagToggle
                    key={d.id}
                    active={district === d.id}
                    onClick={() => setDistrict(district === d.id ? null : d.id)}
                  >
                    {d.name}
                    <span className="ml-1 text-ink-soft/70">· {okrug}</span>
                  </TagToggle>
                )),
              )}
            </div>
          </div>
        ) : null}

        {hasFilters ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
          >
            <X className="size-4" aria-hidden />
            Сбросить фильтры
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-8 text-center shadow-card">
          <p className="text-base font-semibold text-ink">
            {items.length === 0
              ? "Здесь пока пусто"
              : "По этим фильтрам ничего не нашлось"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            {items.length === 0
              ? "Мы добавляем проверенные ветклиники, груминг и передержку. Загляни чуть позже!"
              : "Попробуй сбросить фильтры и посмотреть все сервисы рядом."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}
    </div>
  );
}
