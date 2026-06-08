"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Кнопки разбора жалобы: «Рассмотрено» (resolved) и «Отклонить» (dismissed). */
export function ModerationControls({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decide = async (status: "resolved" | "dismissed") => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/moderation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setError("Не получилось. Попробуйте ещё раз.");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => decide("resolved")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-status-found/40 bg-status-found/10 px-3.5 py-1.5 text-sm font-semibold text-status-found-ink transition-colors hover:bg-status-found/20 disabled:opacity-50",
        )}
      >
        <Check className="size-4" aria-hidden />
        Рассмотрено
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => decide("dismissed")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-blush bg-card px-3.5 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-petal/60 hover:text-ink disabled:opacity-50",
        )}
      >
        <X className="size-4" aria-hidden />
        Отклонить
      </button>
      {error ? <span className="text-sm text-status-lost">{error}</span> : null}
    </div>
  );
}
