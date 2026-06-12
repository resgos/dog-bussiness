import { db } from "@/lib/db";

/**
 * Ценообразование вариантов товара (общее для чекаута и корзины — единый
 * источник правды, чтобы превью в корзине не расходилось со списанием).
 * Cookie хранит выбранные опции меткой «Группа: Значение · …»; надбавки
 * (priceDelta) считаем ТОЛЬКО на сервере по таблице ProductVariant.
 */

/** Индекс надбавок: `${productId}|${name}|${value}` → priceDelta. */
export async function loadVariantDeltaIndex(
  productIds: string[],
): Promise<Map<string, number>> {
  const index = new Map<string, number>();
  if (productIds.length === 0) return index;
  const rows = await db.productVariant.findMany({
    where: { productId: { in: productIds } },
  });
  for (const v of rows) {
    index.set(`${v.productId}|${v.name}|${v.value}`, v.priceDelta);
  }
  return index;
}

/** Суммарная надбавка по метке варианта (неизвестные/битые пары → 0). */
export function deltaForLabel(
  index: Map<string, number>,
  productId: string,
  label: string | undefined,
): number {
  if (!label) return 0;
  let sum = 0;
  for (const part of label.split(" · ")) {
    const i = part.indexOf(": ");
    if (i < 0) continue;
    sum += index.get(`${productId}|${part.slice(0, i)}|${part.slice(i + 2)}`) ?? 0;
  }
  return sum;
}

/**
 * Цена позиции с учётом варианта, не ниже нуля (вариант-скидка не должна
 * уводить цену и итог в минус — у Int-колонок заказа нет CHECK >= 0).
 */
export function linePriceWithVariant(
  index: Map<string, number>,
  productId: string,
  basePriceRub: number,
  label: string | undefined,
): number {
  return Math.max(0, basePriceRub + deltaForLabel(index, productId, label));
}
