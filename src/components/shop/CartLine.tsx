"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Trash2, PawPrint } from "lucide-react";

type Props = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  priceRub: number;
  qty: number;
};

/** Строка корзины: фото, имя, цена и счётчик qty (+/−) → /api/shop/cart. */
export function CartLine({ productId, slug, name, image, priceRub, qty }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const send = async (op: "add" | "remove" | "set", value?: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/shop/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, op, qty: value }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-4">
      <Link
        href={`/shop/product/${slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-blush-soft"
      >
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={image} alt={name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-petal">
            <PawPrint className="size-7" aria-hidden />
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/shop/product/${slug}`}
          className="block truncate font-semibold text-ink hover:text-petal-deep"
        >
          {name}
        </Link>
        <p className="text-sm text-ink-soft">{priceRub} ₽ за шт.</p>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-blush bg-card p-1">
        <button
          type="button"
          onClick={() => send("remove")}
          disabled={busy}
          aria-label="Меньше"
          className="flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-blush-soft disabled:opacity-50"
        >
          {qty <= 1 ? (
            <Trash2 className="size-4" aria-hidden />
          ) : (
            <Minus className="size-4" aria-hidden />
          )}
        </button>
        <span className="w-7 text-center text-sm font-bold tabular-nums">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => send("add")}
          disabled={busy}
          aria-label="Больше"
          className="flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-blush-soft disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      <div className="w-20 shrink-0 text-right font-extrabold tabular-nums text-ink">
        {priceRub * qty} ₽
      </div>
    </div>
  );
}
