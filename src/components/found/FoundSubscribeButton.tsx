"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Кнопка-переключатель «Следить за находкой».
 * По клику дёргает POST /api/found/:id/subscribe и оптимистично переключает
 * состояние; при ошибке — откат. Для анонима показывает мягкую подсказку войти.
 */
export function FoundSubscribeButton({
  foundId,
  initialFollowing,
}: {
  foundId: string;
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
      const res = await fetch(`/api/found/${foundId}/subscribe`, {
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
      aria-label={following ? "Вы следите за находкой" : "Следить за находкой"}
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
