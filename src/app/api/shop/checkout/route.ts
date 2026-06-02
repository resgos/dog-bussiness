import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { readCart, writeCart } from "@/components/shop/cart-cookie";

export const dynamic = "force-dynamic";

/**
 * Оформление заказа из cookie-корзины.
 * Тело: { name?, phone?, address? }
 * Создаёт Order + OrderItem, считает totalRub по актуальным ценам товаров,
 * чистит корзину. Привязывает к пользователю, если он залогинен (гость — null).
 * Ответ: { orderId }.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);

  const str = (v: unknown, max = 200) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

  const cart = await readCart();
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
  }

  // Берём актуальные цены из БД, qty — из корзины.
  const products = await db.product.findMany({ where: { id: { in: ids } } });
  const lines = products
    .map((p) => ({ product: p, qty: cart[p.id] ?? 0 }))
    .filter((l) => l.qty > 0);

  if (lines.length === 0) {
    // Все товары из корзины пропали — чистим, чтобы не залипало.
    await writeCart({});
    return NextResponse.json(
      { error: "Товары из корзины недоступны" },
      { status: 400 },
    );
  }

  const totalRub = lines.reduce((sum, l) => sum + l.product.priceRub * l.qty, 0);
  const user = await getCurrentUser();

  const order = await db.order.create({
    data: {
      userId: user?.id ?? null,
      name: str(body.name),
      phone: str(body.phone),
      address: str(body.address, 400),
      totalRub,
      items: {
        create: lines.map((l) => ({
          productId: l.product.id,
          qty: l.qty,
          priceRub: l.product.priceRub,
        })),
      },
    },
  });

  // Корзина оформлена — очищаем cookie.
  await writeCart({});

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
