"use client";

import { useState } from "react";
import { PawPrint, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";

/**
 * «Это моя собака»: владелец отправляет нашедшему заявку с приметой и контактом.
 * Главный путь связи, когда у находки нет публичных контактов. POST /api/found/{id}/claim.
 */
export function ClaimButton({ foundId }: { foundId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    if (message.trim().length < 10) {
      setError("Опишите примету и оставьте контакт — хотя бы пару фраз.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/found/${foundId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) {
        setError("Войдите, чтобы связаться с нашедшим.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Не удалось отправить.");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <SuccessNote variant="block">
        Заявка отправлена нашедшему — он получит уведомление и свяжется с вами. 💞
      </SuccessNote>
    );
  }

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        <PawPrint className="size-4" aria-hidden />
        Это моя собака
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-blush bg-card p-4 shadow-card">
      <p className="text-sm font-bold text-ink">
        Сообщить нашедшему, что это ваша собака
      </p>
      <p className="mt-1 text-xs text-ink-soft">
        Опишите примету, которую знаете только вы, и оставьте контакт — нашедший
        получит уведомление и свяжется.
      </p>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Это моя Тиша, потерялась 5 июня в Хамовниках. На левом ухе шрам. Телефон +7…"
        maxLength={1000}
        className="mt-3"
      />
      <ErrorBox message={error} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={submit} disabled={busy}>
          <Send className="size-4" aria-hidden />
          {busy ? "Отправляю…" : "Отправить нашедшему"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          <X className="size-4" aria-hidden />
          Отмена
        </Button>
      </div>
    </div>
  );
}
