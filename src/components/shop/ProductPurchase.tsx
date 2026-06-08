"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TagToggle } from "@/components/ui/TagToggle";
import { postJson } from "@/lib/http";

type Variant = {
  id: string;
  name: string;
  value: string;
  priceDelta: number;
};

type Group = {
  name: string;
  values: { value: string; priceDelta: number }[];
};

/** Группирует варианты по name, сохраняя порядок появления групп и значений. */
function groupVariants(variants: Variant[]): Group[] {
  const groups: Group[] = [];
  const byName = new Map<string, Group>();
  for (const variant of variants) {
    let group = byName.get(variant.name);
    if (!group) {
      group = { name: variant.name, values: [] };
      byName.set(variant.name, group);
      groups.push(group);
    }
    group.values.push({ value: variant.value, priceDelta: variant.priceDelta });
  }
  return groups;
}

/** Выбор параметров товара + кнопка «В корзину» (POST /api/shop/cart). */
export function ProductPurchase({
  productId,
  basePrice,
  variants,
}: {
  productId: string;
  basePrice: number;
  variants: Variant[];
}) {
  const router = useRouter();
  const groups = useMemo(() => groupVariants(variants), [variants]);

  const [selected, setSelected] = useState<
    Record<string, { value: string; priceDelta: number }>
  >(() => {
    const initial: Record<string, { value: string; priceDelta: number }> = {};
    for (const group of groups) {
      const first = group.values[0];
      if (first) {
        initial[group.name] = { value: first.value, priceDelta: first.priceDelta };
      }
    }
    return initial;
  });

  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const price =
    basePrice +
    groups.reduce(
      (sum, group) => sum + (selected[group.name]?.priceDelta ?? 0),
      0,
    );

  // Метка варианта для корзины: «Цвет: Розовый · Размер: S».
  const label = groups
    .map((group) => {
      const choice = selected[group.name];
      return choice ? `${group.name}: ${choice.value}` : null;
    })
    .filter((part): part is string => part !== null)
    .join(" · ");

  const choose = (name: string, value: string, priceDelta: number) => {
    setSelected((prev) => ({ ...prev, [name]: { value, priceDelta } }));
    // Выбор изменился — позволим добавить заново.
    setAdded(false);
  };

  const add = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await postJson("/api/shop/cart", { productId, op: "add", variant: label });
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
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.name} className="flex flex-col gap-2">
          <span className="text-sm font-bold text-ink">{group.name}</span>
          <div className="flex flex-wrap gap-2">
            {group.values.map((option) => (
              <TagToggle
                key={`${group.name}-${option.value}`}
                active={selected[group.name]?.value === option.value}
                onClick={() =>
                  choose(group.name, option.value, option.priceDelta)
                }
              >
                {option.value}
              </TagToggle>
            ))}
          </div>
        </div>
      ))}

      <p className="text-3xl font-extrabold text-ink">{price} ₽</p>

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
    </div>
  );
}
