"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MapPin, Crosshair, Navigation, Circle, ArrowDownNarrowWide } from "lucide-react";
import { findDistrict } from "@/lib/districts";
import { timeAgo, plural } from "@/lib/format";
import { distanceKm, formatDistance } from "@/lib/geo";
import { TagToggle } from "@/components/ui/TagToggle";
import { Button } from "@/components/ui/Button";
import { LeafletMap, type MapMarker } from "@/components/map/LeafletMap";

type Sighting = {
  id: string;
  lat: number | null;
  lng: number | null;
  comment: string | null;
  createdAt: Date | string;
};
type Report = {
  id: string;
  petId: string | null;
  petName: string;
  breed: string | null;
  photo: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  radiusKm: number;
  lostAt: Date | string | null;
  createdAt: Date | string;
  sightings: Sighting[];
};

const FILTERS = [
  { id: "all", label: "Все" },
  { id: "lost", label: "🔴 Потерялись" },
  { id: "found", label: "🟢 Найдены" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

const RECENCY = [
  { id: "all", label: "За всё время", days: 0 },
  { id: "1", label: "24 часа", days: 1 },
  { id: "3", label: "3 дня", days: 3 },
  { id: "7", label: "Неделя", days: 7 },
] as const;
type Recency = (typeof RECENCY)[number]["id"];

export function SearchMap({ reports }: { reports: Report[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [recency, setRecency] = useState<Recency>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [nearestFirst, setNearestFirst] = useState(false);
  const [showRadii, setShowRadii] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);

  // Навести карту на метку (nonce заставляет эффект сработать и при повторном клике).
  const focusMarker = (id: string) => {
    setFocusId(id);
    setFocusNonce((n) => n + 1);
  };

  const whenOf = (r: Report) => new Date(r.lostAt ?? r.createdAt).getTime();

  let visible = reports.filter((r) => {
    const byStatus =
      filter === "all" ? true : filter === "lost" ? r.status === "active" : r.status === "found";
    if (!byStatus) return false;
    const days = RECENCY.find((x) => x.id === recency)?.days ?? 0;
    if (days > 0 && Date.now() - whenOf(r) > days * 86_400_000) return false;
    return true;
  });

  // Расстояние от пользователя до точки пропажи.
  const distOf = (r: Report): number | null =>
    userLoc && r.lat != null && r.lng != null
      ? distanceKm(userLoc, { lat: r.lat, lng: r.lng })
      : null;

  if (nearestFirst && userLoc) {
    visible = [...visible].sort((a, b) => {
      const da = distOf(a);
      const db = distOf(b);
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  }

  // Метки для карты: пропажи/находки + наблюдения + «вы здесь».
  const mapMarkers: MapMarker[] = [];
  for (const r of visible) {
    if (r.lat != null && r.lng != null) {
      const found = r.status === "found";
      const sub = [r.breed, r.district ? findDistrict(r.district)?.name : null]
        .filter(Boolean)
        .join(" · ");
      mapMarkers.push({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        kind: found ? "found" : "lost",
        title: r.petName,
        subtitle: sub || undefined,
        meta: `${timeAgo(r.lostAt ?? r.createdAt)} · ${r.sightings.length} ${plural(r.sightings.length, "наблюдение", "наблюдения", "наблюдений")}`,
        photo: r.photo,
        href: r.petId ? `/p/${r.petId}` : found ? "/feed/found" : "/feed/lost",
        radiusKm: r.radiusKm,
        canReport: !found,
      });
    }
    for (const s of r.sightings) {
      if (s.lat != null && s.lng != null) {
        mapMarkers.push({
          id: `s-${s.id}`,
          lat: s.lat,
          lng: s.lng,
          kind: "seen",
          title: `Видели: ${r.petName}`,
          subtitle: s.comment ?? undefined,
          meta: timeAgo(s.createdAt),
        });
      }
    }
  }
  if (userLoc) {
    mapMarkers.push({
      id: "__me__",
      lat: userLoc.lat,
      lng: userLoc.lng,
      kind: "me",
      title: "Вы здесь",
    });
  }

  const focusCard = (id: string) => {
    focusMarker(id);
    if (typeof document !== "undefined") {
      document.getElementById("search-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const locateMe = () => {
    if (locating || typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
        setUserLoc(loc);
        setNearestFirst(true);
        setLocating(false);
        focusMarker("__me__");
      },
      () => setLocating(false),
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

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

    const loc = userLoc;
    if (loc) post(loc.lat, loc.lng);
    else if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => post(p.coords.latitude, p.coords.longitude),
        () => post(null, null),
        { timeout: 8000 },
      );
    } else post(null, null);
  };

  return (
    <div className="space-y-5">
      {/* Фильтры статуса + легенда */}
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

      {/* Свежесть + действия карты */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink-soft">Когда:</span>
        {RECENCY.map((r) => (
          <TagToggle key={r.id} active={recency === r.id} onClick={() => setRecency(r.id)}>
            {r.label}
          </TagToggle>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-blush sm:block" />
        <Button size="sm" variant="secondary" onClick={locateMe} disabled={locating}>
          <Navigation className="size-4" aria-hidden />
          {locating ? "Ищу вас…" : "Рядом со мной"}
        </Button>
        <TagToggle active={showRadii} onClick={() => setShowRadii((v) => !v)}>
          <Circle className="size-3.5" aria-hidden /> Радиусы
        </TagToggle>
        {userLoc ? (
          <TagToggle active={nearestFirst} onClick={() => setNearestFirst((v) => !v)}>
            <ArrowDownNarrowWide className="size-3.5" aria-hidden /> Сначала ближайшие
          </TagToggle>
        ) : null}
      </div>

      <div id="search-map" className="scroll-mt-24">
        <LeafletMap
          markers={mapMarkers}
          height={440}
          showRadii={showRadii}
          focusId={focusId}
          focusNonce={focusNonce}
          fitToMarkers
          onReport={iSaw}
        />
      </div>

      {/* Список меток — кликабельные карточки, синхронизированы с картой */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((r) => {
          const district = r.district ? findDistrict(r.district)?.name : null;
          const found = r.status === "found";
          const dist = distOf(r);
          const active = focusId === r.id;
          return (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => focusCard(r.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  focusCard(r.id);
                }
              }}
              className={`flex cursor-pointer flex-col gap-2 rounded-3xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft ${
                active ? "border-petal ring-2 ring-blush" : "border-blush"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: found ? "#79c98b" : "#ef6461" }}
                />
                <h3 className="font-bold">{r.petName}</h3>
                {dist != null ? (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blush-soft px-2 py-0.5 text-xs font-semibold text-petal-deep">
                    <Navigation className="size-3" aria-hidden />
                    {formatDistance(dist)}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-ink-soft">{r.breed || "Порода не указана"}</p>
              {district ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                  <MapPin className="size-4 text-petal" aria-hidden />
                  {district} · радиус {r.radiusKm} км
                </p>
              ) : null}
              <p className="inline-flex items-center gap-1.5 text-sm text-status-seen">
                <Eye className="size-4" aria-hidden />
                {r.sightings.length}{" "}
                {plural(r.sightings.length, "наблюдение", "наблюдения", "наблюдений")} ·{" "}
                {timeAgo(r.lostAt ?? r.createdAt)}
              </p>
              {!found ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-1 self-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    iSaw(r.id);
                  }}
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
          Меток пока нет — попробуй сменить фильтр.
        </p>
      ) : null}
    </div>
  );
}
