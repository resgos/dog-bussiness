"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { postJson } from "@/lib/http";

/**
 * Тоггл «Гуляю сейчас» — живые «глаза» района.
 * Отмечаешь прогулку → соседи видят тебя на карте поиска (~2 часа).
 */
export function WalkButton({ initialWalking }: { initialWalking: boolean }) {
  const router = useRouter();
  const [walking, setWalking] = useState(initialWalking);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Старт прогулки: берём геолокацию (мягко — без неё тоже отметимся) и постим чек-ин.
  const start = () => {
    if (busy) return;
    setError(null);

    const checkIn = async (lat: number | null, lng: number | null) => {
      setBusy(true);
      try {
        await postJson("/api/walk", { lat, lng });
        setWalking(true);
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Не получилось — попробуй ещё раз.",
        );
      } finally {
        setBusy(false);
      }
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      void checkIn(null, null);
      return;
    }

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        void checkIn(p.coords.latitude, p.coords.longitude);
      },
      // Отказ/таймаут геолокации — не беда: отметим прогулку без точки.
      () => {
        setBusy(false);
        void checkIn(null, null);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  // Завершение прогулки: снимаем чек-ин.
  const stop = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/walk", { method: "DELETE" });
      setWalking(false);
      router.refresh();
    } catch {
      setError("Не получилось — попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      {walking ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={stop}
          disabled={busy}
          title="Вы на карте видны соседям ~2 часа"
        >
          <PawPrint className="size-4" style={{ color: "#7c3aed" }} aria-hidden />
          {busy ? "Завершаю…" : "Завершить прогулку"}
        </Button>
      ) : (
        <Button size="sm" onClick={start} disabled={busy}>
          <PawPrint className="size-4" aria-hidden />
          {busy ? "Отмечаю…" : "🐾 Я на прогулке"}
        </Button>
      )}
      {error ? <span className="text-xs text-status-lost-ink">{error}</span> : null}
      {walking && !error ? (
        <span className="text-xs text-ink-soft">
          Соседи видят вас на карте ~2 часа 💜
        </span>
      ) : null}
    </div>
  );
}
