"use client";

// CSS is SSR-safe; the Leaflet JS itself is imported lazily inside useEffect
// (it touches `window`, so a top-level import would break SSR).
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type {
  Map as LMap,
  LayerGroup as LLayerGroup,
  Marker as LMarker,
} from "leaflet";

export type MapMarker = {
  lat: number;
  lng: number;
  color?: string;
  label?: string;
};

type LeafletMapProps = {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  picker?: boolean;
  onPick?: (lat: number, lng: number) => void;
  picked?: { lat: number; lng: number } | null;
  className?: string;
  height?: number;
};

const MOSCOW: [number, number] = [55.751, 37.618];

function dot(color: string) {
  return `<span style="display:block;width:16px;height:16px;border-radius:50%;border:3px solid #fff;background:${color};box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`;
}

export function LeafletMap({
  markers = [],
  center = MOSCOW,
  zoom = 11,
  picker = false,
  onPick,
  picked = null,
  className,
  height = 360,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markersLayerRef = useRef<LLayerGroup | null>(null);
  const pickedMarkerRef = useRef<LMarker | null>(null);
  // Keep latest onPick in a ref so the click handler (bound once) always
  // calls the current callback without re-initialising the map.
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Init the map exactly once on the client.
  useEffect(() => {
    let cancelled = false;
    let map: LMap | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      map = L.map(containerRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);

      if (picker) {
        map.on("click", (e) => {
          onPickRef.current?.(e.latlng.lat, e.latlng.lng);
        });
      }

      // Leaflet sometimes mis-measures the container when it mounts inside an
      // animating/late-laid-out parent — nudge it to recompute tile size.
      setTimeout(() => map?.invalidateSize(), 0);

      // Paint whatever markers/picked were provided on first mount.
      paintMarkers(L);
      paintPicked(L);
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      pickedMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: redraw all data markers into the layer group.
  const paintMarkers = (L: typeof import("leaflet")) => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const m of markers) {
      const marker = L.marker([m.lat, m.lng], {
        icon: L.divIcon({ className: "", html: dot(m.color ?? "#ef6461") }),
      });
      if (m.label) marker.bindPopup(m.label);
      marker.addTo(layer);
    }
  };

  // Helper: show/update the picked point.
  const paintPicked = (L: typeof import("leaflet")) => {
    const map = mapRef.current;
    if (!map) return;
    if (pickedMarkerRef.current) {
      pickedMarkerRef.current.remove();
      pickedMarkerRef.current = null;
    }
    if (picked) {
      pickedMarkerRef.current = L.marker([picked.lat, picked.lng], {
        icon: L.divIcon({ className: "", html: dot("#ef6461") }),
      }).addTo(map);
    }
  };

  // Re-paint data markers whenever they change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      paintMarkers(L);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  // Re-paint the picked point (and recenter the map on it) when it changes.
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
  }, [picked]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden rounded-3xl border border-blush ${className ?? ""}`}
      style={{ height }}
    />
  );
}
