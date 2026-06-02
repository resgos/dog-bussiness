import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  applyOp,
  cartCount,
  readCart,
  writeCart,
} from "@/components/shop/cart-cookie";

export const dynamic = "force-dynamic";

/** Текущее число позиций в корзине. */
export async function GET() {
  const cart = await readCart();
  return NextResponse.json({ count: cartCount(cart) });
}

/**
 * Изменить корзину.
 * Тело: { productId: string, op: "add" | "remove" | "set", qty?: number }
 * Ответ: { count, qty } — общее число позиций и количество этого товара.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const op = body.op;
  const qty = typeof body.qty === "number" ? body.qty : undefined;

  if (!productId) {
    return NextResponse.json({ error: "productId обязателен" }, { status: 400 });
  }
  if (op !== "add" && op !== "remove" && op !== "set") {
    return NextResponse.json({ error: "Неизвестная операция" }, { status: 400 });
  }

  // Добавлять можно только существующий товар (remove/set по уже лежащему — ок).
  if (op === "add") {
    const exists = await db.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }
  }

  const cart = await readCart();
  const next = applyOp(cart, productId, op, qty);
  await writeCart(next);

  return NextResponse.json({
    count: cartCount(next),
    qty: next[productId] ?? 0,
  });
}
