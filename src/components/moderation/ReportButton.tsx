"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { postJson } from "@/lib/http";
import { cn } from "@/lib/cn";

type Reason = "spam" | "abuse" | "fake" | "other";

const REASONS: { value: Reason; label: string }[] = [
  { value: "spam", label: "Спам" },
  { value: "abuse", label: "Оскорбление" },
  { value: "fake", label: "Фейк" },
  { value: "other", label: "Другое" },
];

/**
 * Ненавязчивая кнопка «Пожаловаться» с мини-меню выбора причины.
 * Доступна всем (жалобу можно оставить и без входа).
 */
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: string;
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const report = async (reason: Reason) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/report", { targetType, targetId, reason });
      setSent(true);
      setOpen(false);
    } catch {
      setError("Не получилось. Попробуйте позже.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
        <Flag className="size-3.5" aria-hidden />
        Спасибо, жалоба отправлена
      </span>
    );
  }

  return (
    <span className="relative inline-flex flex-col items-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs text-ink-soft transition-colors hover:text-ink"
      >
        <Flag className="size-3.5" aria-hidden />
        Пожаловаться
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1.5 min-w-[10rem] rounded-2xl border border-blush bg-card p-1.5 shadow-card">
          <p className="px-2.5 py-1 text-xs font-semibold text-ink-soft">
            Причина жалобы
          </p>
          {REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              disabled={busy}
              onClick={() => report(r.value)}
              className={cn(
                "block w-full rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-ink transition-colors hover:bg-blush-soft disabled:opacity-50",
              )}
            >
              {r.label}
            </button>
          ))}
          {error ? (
            <p className="px-2.5 py-1 text-xs text-status-lost">{error}</p>
          ) : null}
        </div>
      ) : null}
    </span>
  );
}
