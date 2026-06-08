"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { postJson } from "@/lib/http";

/**
 * Мягкое напоминание подтвердить e-mail. Вход не блокируется —
 * это лишь баннер с кнопкой повторной отправки письма.
 * Если e-mail не задан или уже подтверждён — ничего не показываем.
 */
export function VerifyBanner({
  email,
  verified,
}: {
  email?: string | null;
  verified: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!email || verified) return null;

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/auth/resend-verify");
      setSent(true);
    } catch {
      setError("Не получилось отправить. Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-3xl border border-blush bg-paw/20 p-5 shadow-card">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paw/40 text-ink">
        <MailWarning className="size-5" aria-hidden />
      </span>
      <div className="mr-auto min-w-[12rem]">
        <p className="font-bold text-ink">
          Подтвердите e-mail, чтобы не потерять доступ к оповещениям
        </p>
        {sent ? (
          <p className="mt-1 text-sm text-ink-soft">
            Письмо отправлено — проверьте почту 🐾
          </p>
        ) : (
          <p className="text-sm text-ink-soft">
            Мы отправили ссылку на {email}. Перейдите по ней, чтобы получать
            SOS-сигналы соседей.
          </p>
        )}
        {error ? <p className="mt-1 text-sm text-status-lost">{error}</p> : null}
      </div>
      {sent ? null : (
        <Button variant="secondary" onClick={resend} disabled={busy}>
          {busy ? "Отправляю…" : "Отправить письмо снова"}
        </Button>
      )}
    </div>
  );
}
