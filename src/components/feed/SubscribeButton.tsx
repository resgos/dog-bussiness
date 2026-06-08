"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Кнопка-переключатель «Следить за розыском».
 * По клику дёргает POST /api/reports/:id/subscribe и оптимистично переключает
 * состояние; при ошибке — откат. Для анонима показывает мягкую подсказку войти.
 */
export function SubscribeButton({
  reportId,
  initialFollowing,
}: {
  reportId: string;
  initialFollowing?: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [busy, setBusy] = useState(false);
  const [needAuth, setNeedAuth] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setNeedAuth(false);
    const prev = following;
    // оптимистично переключаем
    setFollowing(!prev);
    try {
      const res = await fetch(`/api/reports/${reportId}/subscribe`, {
        method: "POST",
      });
      if (res.status === 401) {
        setFollowing(prev);
        setNeedAuth(true);
        return;
      }
      if (!res.ok) {
        setFollowing(prev);
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        following?: boolean;
      } | null;
      if (typeof data?.following === "boolean") {
        setFollowing(data.following);
      }
    } catch {
      // сеть подвела — откатываем оптимистичное переключение
      setFollowing(prev);
    } finally {
      setBusy(false);
    }
  };

  if (needAuth) {
    return (
      <Link
        href="/auth"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
      >
        <Bell className="size-4" aria-hidden />
        Войдите, чтобы следить
      </Link>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      aria-label={following ? "Вы следите за розыском" : "Следить за розыском"}
    >
      {following ? (
        <BellRing className="size-4" aria-hidden />
      ) : (
        <Bell className="size-4" aria-hidden />
      )}
      {following ? "Вы следите" : "Следить"}
    </Button>
  );
}
