"use client";

import { useState } from "react";
import { Camera, Crosshair, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { postJson } from "@/lib/http";

type SightingModalProps = {
  reportId: string;
  petName: string;
  onClose: () => void;
  onDone: () => void;
};

/** Текущая геопозиция (таймаут 8с). При отказе/ошибке — null, без исключений. */
function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ lat: null, lng: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 8000 },
    );
  });
}

export function SightingModal({ reportId, petName, onClose, onDone }: SightingModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка фото с уменьшением (паттерн из PetWizard — не хранить мегабайты в БД).
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = document.createElement("img");
      img.onload = () => {
        const max = 720;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setPhoto(canvas.toDataURL("image/jpeg", 0.82));
        } else {
          setPhoto(src);
        }
      };
      img.onerror = () => setPhoto(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { lat, lng } = await getLocation();
      await postJson("/api/sightings", {
        reportId,
        lat,
        lng,
        comment: comment.trim() || null,
        photo,
      });
      onDone();
      onClose();
    } catch {
      setError("Не удалось отправить. Попробуй ещё раз.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Видели ${petName}?`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-blush bg-card p-6 shadow-card"
        style={{ animation: "fade-up 0.25s ease-out both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">Видели {petName}?</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-blush-soft hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Любая деталь помогает найти. Фото и комментарий — по желанию.
        </p>

        <div className="mt-5 space-y-4">
          {/* Необязательное фото */}
          {photo ? (
            <div className="space-y-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-blush">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="Фото наблюдения" className="size-full object-cover" />
              </div>
              <div className="flex gap-4 text-sm font-semibold">
                <label className="cursor-pointer text-petal-deep hover:underline">
                  Заменить фото
                  <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                </label>
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="text-ink-soft hover:text-status-lost"
                >
                  Убрать
                </button>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-blush bg-blush-soft/50 py-7 text-ink-soft transition-colors hover:border-petal hover:text-petal-deep">
              <Camera className="size-7" aria-hidden />
              <span className="text-sm font-semibold">Добавить фото</span>
              <span className="text-xs">Можно прямо с камеры</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onPhoto}
              />
            </label>
          )}

          {/* Необязательный комментарий */}
          <Field label="Комментарий">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Где и когда видели, куда направлялась…"
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={submitting}>
            <Crosshair className="size-4" aria-hidden />
            {submitting ? "Отправляю…" : "Отправить"}
          </Button>
        </div>
        {error ? (
          <p className="mt-2 text-right text-xs text-status-lost">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
