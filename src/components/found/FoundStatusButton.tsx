"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Кнопка владельца находки: «Хозяин нашёлся!» (status → reunited).
 * Паттерн как у SearchControls: PATCH /api/found/{id} + router.refresh().
 */
export function FoundStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Уже воссоединённую находку больше не закрываем.
  if (status !== "open") return null;

  const markReunited = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/found/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reunited" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="sm" variant="primary" onClick={markReunited} disabled={busy}>
      <Check className="size-4" aria-hidden />
      {busy ? "…" : "Хозяин нашёлся! 🎉"}
    </Button>
  );
}
