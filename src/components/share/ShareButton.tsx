"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ShareButtonProps = {
  /** Относительный путь страницы, например `/p/abc123`. */
  path: string;
  title: string;
  text?: string;
};

/**
 * Кнопка «Поделиться» паспортом питомца — главный виральный канал поиска.
 * Native Web Share API (мобильные), иначе — копирование ссылки в буфер.
 * Всё завязано на onClick → безопасно для SSR (navigator читается только в браузере).
 */
export function ShareButton({ path, title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    // origin доступен только в браузере; собираем абсолютную ссылку здесь.
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* пользователь закрыл системный диалог — это не ошибка */
      }
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        /* буфер недоступен — тихо игнорируем */
      }
    }
  };

  return (
    <div className="relative inline-flex">
      <Button variant="secondary" onClick={share} aria-label="Поделиться паспортом">
        {copied ? (
          <Check className="size-4 text-petal-deep" aria-hidden />
        ) : (
          <Share2 className="size-4" aria-hidden />
        )}
        Поделиться
      </Button>

      {copied ? (
        <span
          role="status"
          className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-lift"
        >
          Скопировано! ✓
        </span>
      ) : null}
    </div>
  );
}
