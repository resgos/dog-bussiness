"use client";

import { useState } from "react";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/cn";

/** Галерея фото товара: крупное фото + ряд миниатюр для переключения. */
export function ProductGallery({
  images,
  alt,
}: {
  images: { url: string }[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-blush bg-blush-soft text-petal shadow-card">
        <PawPrint className="size-20" aria-hidden />
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-blush bg-blush-soft shadow-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={alt} className="size-full object-cover" />
      </div>

      {images.length > 1 ? (
        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Показать фото ${index + 1}`}
              aria-pressed={index === active}
              className={cn(
                "relative size-20 overflow-hidden rounded-2xl border bg-blush-soft transition-all",
                index === active
                  ? "border-petal ring-2 ring-petal"
                  : "border-blush hover:border-petal/60",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`${alt} — фото ${index + 1}`}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
