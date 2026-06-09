"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Кнопка «Поднять в топ» — платное продвижение розыска (демо-оплата).
 * По клику дёргает POST /api/reports/:id/boost: на успехе показывает плашку
 * «Продвигается до …» и обновляет страницу. При ошибке тихо возвращает кнопку.
 */
function inFuture(value?: Date | string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return d.getTime() > Date.now() ? d : null;
}

export function BoostButton({
  reportId,
  boostedUntil,
}: {
  reportId: string;
  boostedUntil?: Date | string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // Локальная дата продвижения: либо пришедшая из пропсов, либо проставленная
  // после успешного POST (чтобы плашка появилась сразу, до router.refresh()).
  const [until, setUntil] = useState<Date | null>(() => inFuture(boostedUntil));

  const boost = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/boost`, {
        method: "POST",
      });
      if (!res.ok) return; // ошибка — тихо вернём кнопку
      const data = (await res.json().catch(() => null)) as {
        boostedUntil?: string;
      } | null;
      setUntil(inFuture(data?.boostedUntil) ?? new Date());
      router.refresh();
    } catch {
      // сеть подвела — оставляем кнопку как есть
    } finally {
      setBusy(false);
    }
  };

  if (until) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-paw/30 px-4 py-2 text-sm font-semibold text-petal-deep">
        🚀 Продвигается до {until.toLocaleDateString("ru-RU")}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Button size="sm" onClick={boost} disabled={busy}>
        <Rocket className="size-4" aria-hidden />
        {busy ? "Поднимаем…" : "🚀 Поднять в топ · 299 ₽"}
      </Button>
      <span className="pl-1 text-[11px] text-ink-soft">демо-оплата</span>
    </span>
  );
}
