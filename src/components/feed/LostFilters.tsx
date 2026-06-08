"use client";

import { useMemo, useState } from "react";
import { Search, X, Eye } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { TagToggle } from "@/components/ui/TagToggle";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { findDistrict } from "@/lib/districts";
import { sizeOptions } from "@/lib/petForm";
import { ReportCard } from "./ReportCard";

/** Карточке достаточно этих полей — повторяем форму ReportLite из ReportCard. */
type LostReport = {
  id: string;
  petName: string;
  breed: string | null;
  size: string | null;
  color: string | null;
  photo: string | null;
  district: string | null;
  lostAt: Date | string | null;
  comment: string | null;
  radiusKm: number;
  reward: number | null;
  status: string;
  createdAt: Date | string;
  sightings: { id: string }[];
};

/** Лента активных пропаж с поиском по кличке/породе и фильтром по району (клиент). */
export function LostFilters({ reports }: { reports: LostReport[] }) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState<string | null>(null);
  const [breed, setBreed] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [withSightings, setWithSightings] = useState(false);

  // Чипы только для районов, которые реально встречаются в объявлениях — лишних не плодим.
  const presentDistricts = useMemo(() => {
    const ids = new Set(
      reports.map((r) => r.district).filter(Boolean) as string[],
    );
    return [...ids]
      .map((id) => ({ id, name: findDistrict(id)?.name ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [reports]);

  // Породы, реально встречающиеся в объявлениях (непустые, уникальные).
  const presentBreeds = useMemo(() => {
    const set = new Set(
      reports.map((r) => r.breed?.trim()).filter(Boolean) as string[],
    );
    return [...set].sort((a, b) => a.localeCompare(b, "ru"));
  }, [reports]);

  // Размеры — только те из справочника, что присутствуют в объявлениях.
  const presentSizes = useMemo(() => {
    const set = new Set(
      reports.map((r) => r.size).filter(Boolean) as string[],
    );
    return sizeOptions.filter((o) => set.has(o.value));
  }, [reports]);

  // Окрасы, реально встречающиеся в объявлениях (непустые, уникальные).
  const presentColors = useMemo(() => {
    const set = new Set(
      reports.map((r) => r.color?.trim()).filter(Boolean) as string[],
    );
    return [...set].sort((a, b) => a.localeCompare(b, "ru"));
  }, [reports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (district && r.district !== district) return false;
      if (breed && r.breed !== breed) return false;
      if (size && r.size !== size) return false;
      if (color && r.color !== color) return false;
      if (withSightings && r.sightings.length === 0) return false;
      if (q) {
        const hay = [r.petName, r.breed]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reports, query, district, breed, size, color, withSightings]);

  const hasFilters = Boolean(
    query.trim() || district || breed || size || color || withSightings,
  );

  const reset = () => {
    setQuery("");
    setDistrict(null);
    setBreed(null);
    setSize(null);
    setColor(null);
    setWithSightings(false);
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
            placeholder="Поиск по кличке или породе…"
            className="pl-11"
            aria-label="Поиск по пропавшим"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Район</p>
          <div className="flex flex-wrap gap-2">
            <TagToggle active={district === null} onClick={() => setDistrict(null)}>
              Все районы
            </TagToggle>
            {presentDistricts.map((d) => (
              <TagToggle
                key={d.id}
                active={district === d.id}
                onClick={() => setDistrict(district === d.id ? null : d.id)}
              >
                {d.name}
              </TagToggle>
            ))}
          </div>
        </div>

        {presentBreeds.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Порода</p>
            <div className="flex flex-wrap gap-2">
              <TagToggle active={breed === null} onClick={() => setBreed(null)}>
                Все
              </TagToggle>
              {presentBreeds.map((b) => (
                <TagToggle
                  key={b}
                  active={breed === b}
                  onClick={() => setBreed(breed === b ? null : b)}
                >
                  {b}
                </TagToggle>
              ))}
            </div>
          </div>
        ) : null}

        {presentSizes.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Размер</p>
            <div className="flex flex-wrap gap-2">
              <TagToggle active={size === null} onClick={() => setSize(null)}>
                Любой
              </TagToggle>
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

        {presentColors.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Окрас</p>
            <div className="flex flex-wrap gap-2">
              <TagToggle active={color === null} onClick={() => setColor(null)}>
                Любой
              </TagToggle>
              {presentColors.map((c) => (
                <TagToggle
                  key={c}
                  active={color === c}
                  onClick={() => setColor(color === c ? null : c)}
                >
                  {c}
                </TagToggle>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <TagToggle
            active={withSightings}
            onClick={() => setWithSightings((v) => !v)}
          >
            <Eye className="size-3.5" aria-hidden /> С наблюдениями
          </TagToggle>
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
            message="Ничего не нашли — попробуй сменить фильтр."
          />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
