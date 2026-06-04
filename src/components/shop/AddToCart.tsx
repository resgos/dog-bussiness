"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { postJson } from "@/lib/http";

/** Кнопка «В корзину» на странице товара → POST /api/shop/cart {op:"add"}. */
export function AddToCart({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const add = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await postJson("/api/shop/cart", { productId, op: "add" });
      setAdded(true);
      // Обновим серверные данные (бейдж корзины в шапке, если он есть).
      router.refresh();
    } catch {
      /* при ошибке оставляем кнопку в исходном состоянии */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button size="lg" onClick={add} disabled={busy}>
        {added ? (
          <Check className="size-5" aria-hidden />
        ) : (
          <ShoppingCart className="size-5" aria-hidden />
        )}
        {busy ? "Добавляю…" : added ? "Добавлено" : "В корзину"}
      </Button>
      {added ? (
        <ButtonLink href="/shop/cart" variant="secondary" size="lg">
          В корзину
          <ArrowRight className="size-5" aria-hidden />
        </ButtonLink>
      ) : null}
    </div>
  );
}
