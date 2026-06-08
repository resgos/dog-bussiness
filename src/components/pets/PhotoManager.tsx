"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";

const MAX_PHOTOS = 10;

type Photo = { id: string; url: string };

/**
 * Сжимает выбранный файл через canvas (макс. сторона ~1000px, JPEG ~0.8),
 * чтобы не хранить мегабайты в БД. Возвращает data URL.
 */
function compressToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const src = reader.result as string;
      const img = document.createElement("img");
      img.onload = () => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/** Менеджер галереи дополнительных ракурсов питомца (форма редактирования). */
export function PhotoManager({
  petId,
  initial,
}: {
  petId: string;
  initial: Photo[];
}) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const full = photos.length >= MAX_PHOTOS;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Сбрасываем input, чтобы повторно можно было выбрать тот же файл.
    e.target.value = "";
    if (!file || busy) return;
    if (full) {
      setError("Максимум 10 фото");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const url = await compressToDataUrl(file);
      const res = await fetch(`/api/pets/${petId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.id || !data.url) {
        throw new Error(data.error || "Не удалось добавить фото");
      }
      setPhotos((p) => [...p, { id: data.id!, url: data.url! }]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось добавить фото",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (photoId: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pets/${petId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (!res.ok) throw new Error();
      setPhotos((p) => p.filter((x) => x.id !== photoId));
    } catch {
      setError("Не удалось удалить фото. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-blush bg-blush-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt="Ракурс питомца"
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={busy}
                aria-label="Удалить фото"
                className="absolute right-1.5 top-1.5 inline-flex size-8 items-center justify-center rounded-full bg-card/90 text-status-lost shadow-card transition-colors hover:bg-status-lost hover:text-white disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={busy || full}
        >
          <ImagePlus className="size-4" aria-hidden />
          {busy ? "Загружаю…" : "Добавить фото"}
        </Button>
      </div>

      {full ? (
        <p className="text-sm font-semibold text-petal-deep">Максимум 10 фото</p>
      ) : null}

      {error ? <ErrorBox message={error} /> : null}

      <p className="text-xs text-ink-soft">
        {photos.length}/10 фото · разные ракурсы помогают узнать собаку
      </p>
    </div>
  );
}
