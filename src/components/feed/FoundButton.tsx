"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Отметить объявление как «найдена» → создаёт событие для счётчика. */
export function FoundButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const mark = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "found" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="sm" variant="secondary" onClick={mark} disabled={busy}>
      <Check className="size-4" aria-hidden />
      {busy ? "…" : "Нашлась!"}
    </Button>
  );
}
