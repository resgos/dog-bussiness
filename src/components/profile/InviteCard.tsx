"use client";

import { useState } from "react";
import { Check, Copy, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

type InviteCardProps = {
  /** Персональный реферальный код (или null у старых аккаунтов). */
  code: string | null;
  /** Сколько соседей уже пришло по приглашению. */
  invited: number;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";

/**
 * Карточка реферальной программы: персональная ссылка-приглашение соседа.
 * navigator.clipboard / navigator.share читаются только в onClick — безопасно для SSR.
 */
export function InviteCard({ code, invited }: InviteCardProps) {
  const [copied, setCopied] = useState(false);

  // Старый аккаунт без кода — мягко объясняем, ничего не ломаем.
  if (!code) {
    return (
      <div className="rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blush-soft text-petal-deep">
            <Users className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">
              Личная ссылка скоро появится
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Код приглашения появится после следующего входа — загляни сюда чуть
              позже, и можно будет звать соседей в стаю 🐾
            </p>
          </div>
        </div>
      </div>
    );
  }

  const link = `${SITE_URL}/auth?ref=${code}`;

  const copy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* буфер недоступен — тихо игнорируем */
    }
  };

  const share = async () => {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({
        title: "Лапка помощи",
        text: "Заходи в стаю — вместе быстрее находим потерявшихся собак в районе!",
        url: link,
      });
    } catch {
      /* пользователь закрыл системный диалог — это не ошибка */
    }
  };

  return (
    <div className="rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-paw/40 text-ink">
          <Users className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">Твоя ссылка-приглашение</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Отправь её соседу — он попадёт прямо в регистрацию, а мы запомним, что
            это ты привёл его в стаю.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Input
          value={link}
          readOnly
          aria-label="Ссылка-приглашение"
          onFocus={(e) => e.currentTarget.select()}
          className="font-medium"
        />
        <div className="flex shrink-0 gap-2">
          <Button onClick={copy} aria-label="Скопировать ссылку">
            {copied ? (
              <>
                <Check className="size-4" aria-hidden />
                Скопировано ✓
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden />
                Скопировать
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={share}
            aria-label="Поделиться ссылкой"
            className="sm:px-4"
          >
            <Share2 className="size-4" aria-hidden />
            <span className="sm:sr-only">Поделиться</span>
          </Button>
        </div>
      </div>

      <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink">
        <PawCount value={invited} />
      </p>
    </div>
  );
}

/** «Вы привели: N» с мягким акцентом на числе. */
function PawCount({ value }: { value: number }) {
  return (
    <>
      <span className="text-ink-soft">Вы привели:</span>
      <span className="text-coral">{value}</span>
    </>
  );
}
