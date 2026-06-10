"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Кликабельное фото с полноэкранным просмотром (лайтбокс).
 * В карточках фото кропится под пропорции (object-cover) — лайтбокс показывает
 * оригинал целиком (object-contain). Закрытие: клик по фону, крестик, Esc.
 */
export function PhotoLightbox({
  src,
  alt,
  className,
  imgClassName = "size-full object-cover",
}: {
  src: string;
  alt: string;
  /** Классы кнопки-обёртки (задаёт размеры/позиционирование в карточке). */
  className?: string;
  /** Классы превью-картинки внутри кнопки. */
  imgClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Блокируем прокрутку фона, пока открыт просмотр.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group/photo cursor-zoom-in ${className ?? ""}`}
        aria-label={`Открыть фото: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`${imgClassName} transition-transform duration-300 group-hover/photo:scale-[1.03]`}
        />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть просмотр"
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
          >
            <X className="size-6" aria-hidden />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
