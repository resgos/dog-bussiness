import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  applyOp,
  cartCount,
  readCart,
  writeCart,
  readVariants,
  writeVariants,
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

  // Добавлять/задавать количество можно только для существующего товара.
  // (remove лишь убирает позицию и несуществующий id в корзину не пишет.)
  if (op === "add" || op === "set") {
    const exists = await db.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }
  }

  const variant =
    typeof body.variant === "string" ? body.variant.trim().slice(0, 200) : "";

  const cart = await readCart();
  const next = applyOp(cart, productId, op, qty);
  await writeCart(next);

  // Параллельно ведём выбранный вариант товара: при добавлении/установке —
  // сохраняем, при удалении позиции — чистим.
  const variants = await readVariants();
  if (!next[productId]) {
    delete variants[productId];
  } else if ((op === "add" || op === "set") && variant) {
    variants[productId] = variant;
  }
  await writeVariants(variants);

  return NextResponse.json({
    count: cartCount(next),
    qty: next[productId] ?? 0,
  });
}
