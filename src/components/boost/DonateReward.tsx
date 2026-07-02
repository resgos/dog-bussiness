"use client";

import { useState } from "react";
import { HeartHandshake, LogIn } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { postJson } from "@/lib/http";

/**
 * «Награда от соседей» — краудфандинг награды розыска (P1 #4 бизнес-беклога).
 * Сосед добавляет 100/300/500 ₽ к наградному пулу (демо-оплата, Purchase).
 * Гостю — мост в /auth; на закрытом розыске — только итоговая сумма.
 */
export function DonateReward({
  reportId,
  initialTotal,
  isAuthed,
  active,
}: {
  reportId: string;
  initialTotal: number;
  isAuthed: boolean;
  active: boolean;
}) {
  const [total, setTotal] = useState(initialTotal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Закрытый розыск без единого доната — блока нет вовсе.
  if (!active && total === 0) return null;

  const donate = async (amountRub: number) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const j = await postJson<{ total: number }>(
        `/api/reports/${reportId}/donate`,
        { amountRub },
      );
      setTotal(j.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не получилось — попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-blush-soft p-4">
      <p className="inline-flex items-center gap-2 font-bold text-ink">
        <HeartHandshake className="size-5 text-petal-deep" aria-hidden />
        Награда от соседей{total > 0 ? `: ${total.toLocaleString("ru-RU")} ₽` : ""}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {active
          ? "Скиньтесь на награду нашедшему — деньги района работают на поиск."
          : "Розыск завершён — спасибо каждому, кто добавил к награде."}
      </p>
      {active ? (
        isAuthed ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {[100, 300, 500].map((amount) => (
              <Button
                key={amount}
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => donate(amount)}
              >
                +{amount} ₽
              </Button>
            ))}
            <span className="text-[11px] text-ink-soft">демо-оплата</span>
          </div>
        ) : (
          <ButtonLink href="/auth" variant="secondary" size="sm" className="mt-3">
            <LogIn className="size-4" aria-hidden />
            Войдите, чтобы добавить к награде
          </ButtonLink>
        )
      ) : null}
      {error ? <p className="mt-2 text-sm text-status-lost-ink">{error}</p> : null}
    </div>
  );
}
