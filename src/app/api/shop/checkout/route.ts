import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  buildCartLines,
  cartTotal,
  readCart,
  writeCart,
  readVariants,
  writeVariants,
} from "@/components/shop/cart-cookie";

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

  // Контакты обязательны: без имени и телефона заказ не оформляем.
  // (Клиентская форма их уже требует — сервер дублирует проверку.)
  const name = str(body.name);
  const phone = str(body.phone);
  if (!name || !phone) {
    return NextResponse.json(
      { error: "Укажите имя и телефон" },
      { status: 400 },
    );
  }

  const cart = await readCart();
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
  }

  // Берём актуальные цены из БД, qty — из корзины.
  const products = await db.product.findMany({ where: { id: { in: ids } } });
  const lines = buildCartLines(products, cart);

  if (lines.length === 0) {
    // Все товары из корзины пропали — чистим, чтобы не залипало.
    await writeCart({});
    return NextResponse.json(
      { error: "Товары из корзины недоступны" },
      { status: 400 },
    );
  }

  const totalRub = cartTotal(lines);
  const variants = await readVariants();
  const user = await getCurrentUser();

  const order = await db.order.create({
    data: {
      userId: user?.id ?? null,
      name,
      phone,
      address: str(body.address, 400),
      totalRub,
      items: {
        create: lines.map((l) => ({
          productId: l.product.id,
          qty: l.qty,
          priceRub: l.product.priceRub,
          variant: variants[l.product.id] ?? null,
        })),
      },
    },
  });

  // Корзина оформлена — очищаем cookie (и qty, и варианты).
  await writeCart({});
  await writeVariants({});

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
