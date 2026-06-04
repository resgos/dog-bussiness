"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { TagToggle } from "@/components/ui/TagToggle";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { districtsByOkrug } from "@/lib/districts";
import { sizeOptions } from "@/lib/petForm";
import { FoundCard, type FoundItem } from "./FoundCard";

/** Лента находок с поиском по строке и фильтром по району/размеру (клиент). */
export function FoundList({ items }: { items: FoundItem[] }) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);

  // Показываем чипы только для районов, по которым есть находки — лишних не плодим.
  const presentDistricts = useMemo(() => {
    const ids = new Set(items.map((i) => i.district).filter(Boolean) as string[]);
    return Object.entries(districtsByOkrug())
      .map(([okrug, list]) => [okrug, list.filter((d) => ids.has(d.id))] as const)
      .filter(([, list]) => list.length > 0);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (district && i.district !== district) return false;
      if (size && i.size !== size) return false;
      if (q) {
        const hay = [i.breed, i.color, i.comment]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, district, size]);

  const hasFilters = Boolean(query.trim() || district || size);

  const reset = () => {
    setQuery("");
    setDistrict(null);
    setSize(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-3xl border border-blush bg-card p-5 shadow-card sm:p-6">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по породе, окрасу, приметам…"
            className="pl-11"
            aria-label="Поиск по находкам"
          />
        </div>

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

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Размер</p>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((o) => (
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
        <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble
            src="/shunya/pose-surprised.png"
            message={
              items.length === 0
                ? "Пока никто не сообщал о находках. Если ты нашёл собаку — расскажи о ней первым!"
                : "По этим фильтрам ничего не нашлось. Попробуй сбросить их и посмотреть всех."
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <FoundCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
