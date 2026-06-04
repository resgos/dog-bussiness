"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MapPin, Crosshair } from "lucide-react";
import { findDistrict } from "@/lib/districts";
import { TagToggle } from "@/components/ui/TagToggle";
import { Button } from "@/components/ui/Button";
import { LeafletMap, type MapMarker } from "@/components/map/LeafletMap";

type Sighting = { id: string; lat: number | null; lng: number | null; comment: string | null };
type Report = {
  id: string;
  petName: string;
  breed: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  sightings: Sighting[];
};

const FILTERS = [
  { id: "all", label: "Все" },
  { id: "lost", label: "🔴 Потерялись" },
  { id: "found", label: "🟢 Найдены" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

export function SearchMap({ reports }: { reports: Report[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = reports.filter((r) =>
    filter === "all" ? true : filter === "lost" ? r.status === "active" : r.status === "found",
  );

  // Метки для Leaflet: потеря (#ef6461) / найдена (#79c98b) + наблюдения (#6aa9e9).
  const mapMarkers: MapMarker[] = [];
  for (const r of visible) {
    if (r.lat != null && r.lng != null) {
      mapMarkers.push({
        lat: r.lat,
        lng: r.lng,
        color: r.status === "found" ? "#79c98b" : "#ef6461",
        label: r.petName,
      });
    }
    for (const s of r.sightings) {
      if (s.lat != null && s.lng != null) {
        mapMarkers.push({
          lat: s.lat,
          lng: s.lng,
          color: "#6aa9e9",
          label: s.comment ?? "Наблюдение",
        });
      }
    }
  }

  const iSaw = (reportId: string) => {
    if (busyId) return;
    setBusyId(reportId);
    const post = (lat: number | null, lng: number | null) =>
      fetch("/api/sightings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, lat, lng }),
      })
        .then(() => router.refresh())
        .finally(() => setBusyId(null));

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => post(p.coords.latitude, p.coords.longitude),
        () => post(null, null),
        { timeout: 8000 },
      );
    } else {
      post(null, null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <TagToggle key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </TagToggle>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-status-lost" /> поиск
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-status-found" /> найдена
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-status-seen" /> наблюдение
          </span>
        </div>
      </div>

      <LeafletMap markers={mapMarkers} height={440} />

      {/* Метки списком — работает всегда */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((r) => {
          const district = r.district ? findDistrict(r.district)?.name : null;
          const found = r.status === "found";
          return (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-3xl border border-blush bg-card p-5 shadow-card"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: found ? "#79c98b" : "#ef6461" }}
                />
                <h3 className="font-bold">{r.petName}</h3>
              </div>
              <p className="text-sm text-ink-soft">{r.breed || "Порода не указана"}</p>
              {district ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                  <MapPin className="size-4 text-petal" aria-hidden />
                  {district}
                </p>
              ) : null}
              <p className="inline-flex items-center gap-1.5 text-sm text-status-seen">
                <Eye className="size-4" aria-hidden />
                {r.sightings.length} наблюдений
              </p>
              {!found ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-1 self-start"
                  onClick={() => iSaw(r.id)}
                  disabled={busyId === r.id}
                >
                  <Crosshair className="size-4" aria-hidden />
                  {busyId === r.id ? "Отмечаю…" : "Я видел(а) эту собаку"}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-blush bg-card p-8 text-center text-ink-soft shadow-card">
          Меток пока нет.
        </p>
      ) : null}
    </div>
  );
}
