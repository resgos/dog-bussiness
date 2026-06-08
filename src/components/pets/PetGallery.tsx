"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Photo = { id: string; url: string };

/** Просмотр дополнительных ракурсов на публичном паспорте + простой лайтбокс. */
export function PetGallery({
  photos,
  petName,
}: {
  photos: Photo[];
  petName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Esc закрывает лайтбокс.
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex]);

  if (photos.length === 0) return null;

  const open = openIndex !== null ? photos[openIndex] : null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
        Ещё ракурсы
      </h2>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="aspect-square overflow-hidden rounded-2xl border border-blush bg-blush-soft transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blush"
            aria-label={`Открыть фото ${petName} ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={`Ракурс ${petName} ${i + 1}`}
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Фото ${petName}`}
          onClick={() => setOpenIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Закрыть"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-card transition-colors hover:bg-white"
          >
            <X className="size-5" aria-hidden />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={open.url}
            alt={`Фото ${petName}`}
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
