import { cookies } from "next/headers";

/**
 * Корзина живёт в cookie `lapka_cart` как JSON-объект вида { [productId]: qty }.
 * Гость тоже может собирать корзину — она не привязана к пользователю до оформления.
 *
 * Хелперы здесь — только для сервера: вызываются из Route Handler или
 * server-компонентов (используют next/headers cookies()).
 */
export const CART_COOKIE = "lapka_cart";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 дней
const MAX_QTY = 99;

export type Cart = Record<string, number>;

/** Безопасно разобрать произвольное значение в карту { productId: qty }. */
export function parseCart(raw: string | undefined | null): Cart {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const out: Cart = {};
    for (const [id, qty] of Object.entries(data as Record<string, unknown>)) {
      const n = Math.floor(Number(qty));
      if (id && Number.isFinite(n) && n > 0) {
        out[id] = Math.min(n, MAX_QTY);
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Текущая корзина из cookie (await cookies()). */
export async function readCart(): Promise<Cart> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

/** Записать корзину в cookie. Пустую — удалить. Вызывать в Route Handler. */
export async function writeCart(cart: Cart): Promise<void> {
  const store = await cookies();
  const entries = Object.entries(cart).filter(([, q]) => q > 0);
  if (entries.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, JSON.stringify(Object.fromEntries(entries)), {
    httpOnly: false, // читаем и на сервере, и при желании на клиенте
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Суммарное число позиций (для бейджа в шапке). */
export function cartCount(cart: Cart): number {
  return Object.values(cart).reduce((sum, q) => sum + q, 0);
}

/** Применить операцию add|remove|set к корзине и вернуть новую. */
export function applyOp(
  cart: Cart,
  productId: string,
  op: "add" | "remove" | "set",
  qty?: number,
): Cart {
  const next: Cart = { ...cart };
  const current = next[productId] ?? 0;

  if (op === "add") {
    next[productId] = Math.min(current + (qty && qty > 0 ? qty : 1), MAX_QTY);
  } else if (op === "remove") {
    const left = current - (qty && qty > 0 ? qty : 1);
    if (left > 0) next[productId] = left;
    else delete next[productId];
  } else if (op === "set") {
    const n = Math.floor(Number(qty));
    if (Number.isFinite(n) && n > 0) next[productId] = Math.min(n, MAX_QTY);
    else delete next[productId];
  }

  return next;
}
