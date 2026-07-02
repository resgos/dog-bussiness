"use client";

import { useState } from "react";
import { LogIn, Truck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { postJson } from "@/lib/http";

/**
 * «Расклеить за вас» (P1 #7): заказ печати и расклейки плаката по району —
 * партнёр-курьер расклеит до 50 плакатов за 24 часа (демо-оплата, Purchase).
 * Гостю — мост в /auth; заявка идемпотентна (одна на розыск).
 */
export function PosterService({
  reportId,
  isAuthed,
  active,
  alreadyOrdered,
}: {
  reportId: string;
  isAuthed: boolean;
  active: boolean;
  alreadyOrdered: boolean;
}) {
  const [done, setDone] = useState(alreadyOrdered);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!active) return null;

  const order = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await postJson(`/api/reports/${reportId}/poster-service`);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не получилось — попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-blush-soft/70 p-4">
      <p className="inline-flex items-center gap-2 font-bold text-ink">
        <Truck className="size-5 text-petal-deep" aria-hidden />
        Нет времени клеить самому?
      </p>
      {done ? (
        <p className="mt-1 text-sm font-semibold text-status-found-ink">
          ✅ Заявка принята! Расклеим до 50 плакатов по району за 24 часа —
          курьер свяжется с вами.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-soft">
            Напечатаем и расклеим до 50 плакатов по горячим точкам района за 24
            часа.
          </p>
          {isAuthed ? (
            <span className="mt-3 inline-flex flex-col items-start gap-0.5">
              <Button size="sm" onClick={order} disabled={busy}>
                <Truck className="size-4" aria-hidden />
                {busy ? "Оформляем…" : "🚚 Расклеить за меня · 990 ₽"}
              </Button>
              <span className="pl-1 text-[11px] text-ink-soft">демо-оплата</span>
            </span>
          ) : (
            <ButtonLink href="/auth" variant="secondary" size="sm" className="mt-3">
              <LogIn className="size-4" aria-hidden />
              Войдите, чтобы заказать расклейку
            </ButtonLink>
          )}
        </>
      )}
      {error ? <p className="mt-2 text-sm text-status-lost-ink">{error}</p> : null}
    </div>
  );
}
