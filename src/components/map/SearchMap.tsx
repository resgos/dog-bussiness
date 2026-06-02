"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MapPin, Crosshair, Map as MapIcon } from "lucide-react";
import { findDistrict } from "@/lib/districts";
import { TagToggle } from "@/components/ui/TagToggle";
import { Button } from "@/components/ui/Button";

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

const KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY ?? "";

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
  const mapRef = useRef<HTMLDivElement>(null);

  const visible = reports.filter((r) =>
    filter === "all" ? true : filter === "lost" ? r.status === "active" : r.status === "found",
  );

  // Реальная карта Яндекса — только при наличии ключа.
  useEffect(() => {
    if (!KEY || !mapRef.current) return;
    let destroyed = false;
    let map: any;

    const run = async () => {
      try {
        if (!(window as any).ymaps3) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = `https://api-maps.yandex.ru/v3/?apikey=${KEY}&lang=ru_RU`;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("ymaps load failed"));
            document.head.appendChild(s);
          });
        }
        const ymaps3 = (window as any).ymaps3;
        if (!ymaps3 || destroyed || !mapRef.current) return;
        await ymaps3.ready;
        if (destroyed || !mapRef.current) return;

        mapRef.current.innerHTML = "";
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3;
        map = new YMap(mapRef.current, {
          location: { center: [37.617, 55.755], zoom: 10 },
        });
        map.addChild(new YMapDefaultSchemeLayer());
        map.addChild(new YMapDefaultFeaturesLayer());

        const pin = (color: string) => {
          const el = document.createElement("div");
          el.style.cssText = `width:18px;height:18px;border-radius:50%;border:3px solid #fff;background:${color};box-shadow:0 2px 6px rgba(0,0,0,.3)`;
          return el;
        };

        for (const r of visible) {
          if (r.lat != null && r.lng != null) {
            map.addChild(
              new YMapMarker(
                { coordinates: [r.lng, r.lat] },
                pin(r.status === "found" ? "#79c98b" : "#ef6461"),
              ),
            );
          }
          for (const s of r.sightings) {
            if (s.lat != null && s.lng != null) {
              map.addChild(new YMapMarker({ coordinates: [s.lng, s.lat] }, pin("#6aa9e9")));
            }
          }
        }
      } catch {
        /* тихо падаем во фолбэк */
      }
    };

    run();
    return () => {
      destroyed = true;
      try {
        map?.destroy?.();
      } catch {
        /* noop */
      }
    };
  }, [filter, reports, visible]);

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

      {KEY ? (
        <div
          ref={mapRef}
          className="h-[440px] w-full overflow-hidden rounded-3xl border border-blush bg-blush-soft"
        />
      ) : (
        <div className="flex items-center gap-3 rounded-3xl border border-dashed border-blush bg-blush-soft/50 p-5 text-sm text-ink-soft">
          <MapIcon className="size-6 shrink-0 text-petal" aria-hidden />
          Интерактивная карта Яндекса включится с ключом{" "}
          <code className="rounded bg-card px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_YANDEX_MAPS_KEY
          </code>
          . Пока — метки списком ниже.
        </div>
      )}

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
