"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { TagToggle } from "@/components/ui/TagToggle";
import { Reveal } from "@/components/ui/Reveal";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { districtsByOkrug } from "@/lib/districts";
import { sizeOptions } from "@/lib/petForm";
import { AdoptionCard, type AdoptionItem } from "./AdoptionCard";

/** Лента собак на пристройство с фильтром по району и размеру (клиент). */
export function AdoptionList({ items }: { items: AdoptionItem[] }) {
  const [district, setDistrict] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);

  // Чипы районов — только те, по которым реально есть собаки.
  const presentDistricts = useMemo(() => {
    const ids = new Set(items.map((i) => i.district).filter(Boolean) as string[]);
    return Object.entries(districtsByOkrug())
      .map(([okrug, list]) => [okrug, list.filter((d) => ids.has(d.id))] as const)
      .filter(([, list]) => list.length > 0);
  }, [items]);

  // Размеры — только присутствующие, чтобы не предлагать пустые фильтры.
  const presentSizes = useMemo(() => {
    const ids = new Set(items.map((i) => i.size).filter(Boolean) as string[]);
    return sizeOptions.filter((o) => ids.has(o.value));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (district && i.district !== district) return false;
      if (size && i.size !== size) return false;
      return true;
    });
  }, [items, district, size]);

  const hasFilters = Boolean(district || size);

  const reset = () => {
    setDistrict(null);
    setSize(null);
  };

  return (
    <div className="space-y-6">
      {presentDistricts.length > 0 || presentSizes.length > 0 ? (
        <div className="space-y-4 rounded-3xl border border-blush bg-card p-5 shadow-card sm:p-6">
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

          {presentSizes.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Размер</p>
              <div className="flex flex-wrap gap-2">
                {presentSizes.map((o) => (
                  <TagToggle
                    key={o.value}
                    active={size === o.value}
                    onClick={() => setSize(size === o.value ? null : o.value)}
                  >
                    {o.label}
                  </TagToggle>
                ))}
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
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble
            src="/shunya/sm/pose-happy.png"
            message={
              items.length === 0
                ? "Пока никто не разместил собаку на пристройство. Если ты пристраиваешь хвостика — расскажи о нём первым!"
                : "По этим фильтрам собак не нашлось. Попробуй сбросить их и посмотреть всех."
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, i) => (
            <Reveal
              key={item.id}
              delay={Math.min(i, 8) * 0.05}
              className="h-full"
            >
              <AdoptionCard item={item} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
