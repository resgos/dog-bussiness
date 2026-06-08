"use client";

// CSS is SSR-safe; the Leaflet JS itself is imported lazily inside useEffect
// (it touches `window`, so a top-level import would break SSR).
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type {
  Map as LMap,
  LayerGroup as LLayerGroup,
  Marker as LMarker,
  Circle as LCircle,
} from "leaflet";

export type MarkerKind = "lost" | "found" | "seen" | "me" | "walk";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind?: MarkerKind;
  title?: string;
  subtitle?: string;
  meta?: string;
  photo?: string | null;
  href?: string;
  radiusKm?: number;
  /** Показать в попапе кнопку «Я видел(а) здесь». */
  canReport?: boolean;
};

type LeafletMapProps = {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  picker?: boolean;
  onPick?: (lat: number, lng: number) => void;
  picked?: { lat: number; lng: number } | null;
  /** Превью радиуса оповещения вокруг выбранной точки (км) в режиме пикера. */
  pickedRadiusKm?: number;
  /** Рисовать круги радиусов вокруг активных пропаж. */
  showRadii?: boolean;
  /** id метки, на которую навести карту и открыть попап. */
  focusId?: string | null;
  /** Меняется при каждом запросе фокуса — чтобы повторный клик тоже сработал. */
  focusNonce?: number;
  /** При первой отрисовке вписать все метки в видимую область. */
  fitToMarkers?: boolean;
  /** Колбэк кнопки «Я видел(а) здесь» из попапа. */
  onReport?: (id: string) => void;
  className?: string;
  height?: number;
};

const MOSCOW: [number, number] = [55.751, 37.618];

const KIND_COLORS: Record<MarkerKind, string> = {
  lost: "#ef6461",
  found: "#79c98b",
  seen: "#6aa9e9",
  me: "#2f6bd8",
  walk: "#7c3aed",
};

function dot(color: string, me = false) {
  const ring = me ? "box-shadow:0 0 0 5px rgba(47,107,216,.25)" : "box-shadow:0 1px 4px rgba(0,0,0,.4)";
  const size = me ? 18 : 16;
  return `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;border:3px solid #fff;background:${color};${ring}"></span>`;
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

/** Содержимое попапа метки (инлайн-стили — надёжнее внутри Leaflet-попапа). */
function popupHtml(m: MapMarker): string {
  const color = KIND_COLORS[m.kind ?? "lost"];
  const photo = m.photo
    ? `<img src="${esc(m.photo)}" alt="" style="height:6.5rem;width:100%;object-fit:cover;border-radius:.6rem;margin-bottom:.45rem"/>`
    : "";
  const title = `<div style="display:flex;align-items:center;gap:.4rem"><span style="width:.6rem;height:.6rem;border-radius:50%;background:${color};flex:none"></span><strong style="font-size:.95rem;color:#4a4a4a">${esc(m.title ?? "")}</strong></div>`;
  const sub = m.subtitle
    ? `<div style="font-size:.8rem;color:#787169;margin-top:.15rem">${esc(m.subtitle)}</div>`
    : "";
  const meta = m.meta
    ? `<div style="font-size:.72rem;color:#787169;margin-top:.15rem">${esc(m.meta)}</div>`
    : "";
  const open = m.href
    ? `<a href="${esc(m.href)}" style="display:inline-block;padding:.32rem .65rem;border-radius:9999px;background:#facea2;color:#4a4a4a;font-size:.74rem;font-weight:700;text-decoration:none">Открыть</a>`
    : "";
  const report = m.canReport
    ? `<button type="button" data-report-id="${esc(m.id)}" style="padding:.32rem .65rem;border-radius:9999px;background:#fff;border:1px solid #fcd9e2;color:#b35070;font-size:.74rem;font-weight:700;cursor:pointer">🐾 Я видел(а)</button>`
    : "";
  const actions =
    open || report
      ? `<div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.6rem">${open}${report}</div>`
      : "";
  return `<div style="min-width:11.5rem;max-width:14rem">${photo}${title}${sub}${meta}${actions}</div>`;
}

export function LeafletMap({
  markers = [],
  center = MOSCOW,
  zoom = 11,
  picker = false,
  onPick,
  picked = null,
  pickedRadiusKm,
  showRadii = false,
  focusId = null,
  focusNonce = 0,
  fitToMarkers = false,
  onReport,
  className,
  height = 360,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markersLayerRef = useRef<LLayerGroup | null>(null);
  const radiiLayerRef = useRef<LLayerGroup | null>(null);
  const pickedMarkerRef = useRef<LMarker | null>(null);
  const pickedCircleRef = useRef<LCircle | null>(null);
  const markerByIdRef = useRef<Map<string, LMarker>>(new Map());
  const didFitRef = useRef(false);

  // Latest callbacks/flags in refs so the once-bound handlers stay current.
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;
  const focusIdRef = useRef(focusId);
  focusIdRef.current = focusId;
  const fitRef = useRef(fitToMarkers);
  fitRef.current = fitToMarkers;

  // Init the map exactly once on the client.
  useEffect(() => {
    let cancelled = false;
    let map: LMap | null = null;
    const container = containerRef.current;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !container || mapRef.current) return;

      map = L.map(container, { center, zoom, scrollWheelZoom: false });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      radiiLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      if (picker) {
        map.on("click", (e) => onPickRef.current?.(e.latlng.lat, e.latlng.lng));
      }

      setTimeout(() => map?.invalidateSize(), 0);

      paintRadii(L);
      paintMarkers(L);
      paintPicked(L);
    })();

    // Делегируем клик по кнопке «Я видел(а)» внутри попапа.
    const onContainerClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(
        "[data-report-id]",
      ) as HTMLElement | null;
      if (el) {
        e.preventDefault();
        const id = el.getAttribute("data-report-id");
        if (id) onReportRef.current?.(id);
      }
    };
    container?.addEventListener("click", onContainerClick);

    return () => {
      cancelled = true;
      container?.removeEventListener("click", onContainerClick);
      map?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      radiiLayerRef.current = null;
      pickedMarkerRef.current = null;
      pickedCircleRef.current = null;
      markerByIdRef.current.clear();
      didFitRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paintMarkers = (L: typeof import("leaflet")) => {
    const layer = markersLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    markerByIdRef.current.clear();

    for (const m of markers) {
      const kind = m.kind ?? "lost";
      const marker = L.marker([m.lat, m.lng], {
        icon: L.divIcon({
          className: "",
          html: dot(KIND_COLORS[kind], kind === "me"),
          iconSize: kind === "me" ? [18, 18] : [16, 16],
          iconAnchor: kind === "me" ? [9, 9] : [8, 8],
        }),
        title: m.title,
      });
      marker.bindPopup(popupHtml(m), { closeButton: true });
      marker.addTo(layer);
      markerByIdRef.current.set(m.id, marker);
    }

    // Авто-fit один раз, когда метки впервые появились (и нет точечного фокуса).
    if (fitRef.current && !didFitRef.current && !focusIdRef.current) {
      const pts = markers.map((m) => [m.lat, m.lng] as [number, number]);
      if (pts.length === 1) {
        map.setView(pts[0], 14);
        didFitRef.current = true;
      } else if (pts.length > 1) {
        map.fitBounds(L.latLngBounds(pts).pad(0.15));
        didFitRef.current = true;
      }
    }
  };

  const paintRadii = (L: typeof import("leaflet")) => {
    const layer = radiiLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showRadii) return;
    for (const m of markers) {
      if ((m.kind ?? "lost") === "lost" && m.radiusKm && m.radiusKm > 0) {
        L.circle([m.lat, m.lng], {
          radius: m.radiusKm * 1000,
          color: KIND_COLORS.lost,
          weight: 1,
          fillColor: KIND_COLORS.lost,
          fillOpacity: 0.07,
        }).addTo(layer);
      }
    }
  };

  const paintPicked = (L: typeof import("leaflet")) => {
    const map = mapRef.current;
    if (!map) return;
    pickedMarkerRef.current?.remove();
    pickedMarkerRef.current = null;
    pickedCircleRef.current?.remove();
    pickedCircleRef.current = null;
    if (picked) {
      pickedMarkerRef.current = L.marker([picked.lat, picked.lng], {
        icon: L.divIcon({ className: "", html: dot(KIND_COLORS.lost) }),
      }).addTo(map);
      if (pickedRadiusKm && pickedRadiusKm > 0) {
        pickedCircleRef.current = L.circle([picked.lat, picked.lng], {
          radius: pickedRadiusKm * 1000,
          color: KIND_COLORS.lost,
          weight: 1,
          fillColor: KIND_COLORS.lost,
          fillOpacity: 0.08,
        }).addTo(map);
      }
    }
  };

  // Re-paint markers + radii when data/flags change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      paintRadii(L);
      paintMarkers(L);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, showRadii]);

  // Re-paint the picked point (+radius preview) and recenter on it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      paintPicked(L);
      if (picked) mapRef.current?.panTo([picked.lat, picked.lng]);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, pickedRadiusKm]);

  // Focus a given marker: pan to it and open its popup.
  useEffect(() => {
    if (!focusId) return;
    const map = mapRef.current;
    const marker = markerByIdRef.current.get(focusId);
    if (!map || !marker) return;
    const ll = marker.getLatLng();
    map.setView(ll, Math.max(map.getZoom(), 14), { animate: true });
    marker.openPopup();
  }, [focusId, focusNonce]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden rounded-3xl border border-blush ${className ?? ""}`}
      style={{ height }}
    />
  );
}
