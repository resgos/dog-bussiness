"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Управление своим SOS-поиском в личном кабинете.
 * Для активного поиска: «Нашлась!» (status→found) и «Снять с публикации» (status→home).
 * Паттерн взят из FoundButton: fetch PATCH /api/reports/{id} + router.refresh().
 */
export function SearchControls({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Завершённые поиски (found/home) больше не управляются.
  if (status !== "active") return null;

  const patch = async (next: "found" | "home") => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="primary"
        onClick={() => patch("found")}
        disabled={busy}
      >
        <Check className="size-4" aria-hidden />
        {busy ? "…" : "Нашлась! 🎉"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => patch("home")}
        disabled={busy}
      >
        <EyeOff className="size-4" aria-hidden />
        Снять с публикации
      </Button>
    </div>
  );
}
