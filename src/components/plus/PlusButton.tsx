"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { postJson } from "@/lib/http";

/** Дата окончания подписки в формате «9 июня 2026 г.» (или null, если не задана). */
function formatUntil(until?: Date | string | null): string | null {
  if (!until) return null;
  const date = until instanceof Date ? until : new Date(until);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Кнопка оформления «Лапка+». Если подписка активна — показывает плашку со
 * сроком действия. Иначе постит демо-оплату на /api/plus/subscribe и по успеху
 * обновляет серверные данные (router.refresh) + переключается в «активна».
 */
export function PlusButton({
  active = false,
  until = null,
}: {
  active?: boolean;
  until?: Date | string | null;
}) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(active);
  const [untilDate, setUntilDate] = useState<Date | string | null>(until);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<{ ok: boolean; planUntil: string }>(
        "/api/plus/subscribe",
      );
      setUntilDate(res.planUntil ?? null);
      setSubscribed(true);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не получилось — попробуйте ещё раз.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (subscribed) {
    const label = formatUntil(untilDate);
    return (
      <div className="inline-flex items-center gap-2 rounded-3xl border border-blush bg-blush-soft px-5 py-3 font-bold text-petal-deep">
        <Star className="size-5 shrink-0 fill-current" aria-hidden />
        <span>
          ⭐ Лапка+ активна{label ? ` до ${label}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button size="lg" onClick={subscribe} disabled={busy}>
        <Sparkles className="size-5" aria-hidden />
        {busy ? "Оформляю…" : "Оформить Лапка+ · 199 ₽/мес"}
      </Button>
      <span className="text-xs text-ink-soft">
        Демо-оплата — деньги не списываются.
      </span>
      {error ? (
        <span className="text-xs text-status-lost-ink">{error}</span>
      ) : null}
    </div>
  );
}
