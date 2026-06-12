import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  buildCartLines,
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

  const variants = await readVariants();
  // Сбой сессии не должен ронять оформление — оформляем как гостя (userId null).
  const user = await getCurrentUser().catch(() => null);

  // Надбавки выбранных вариантов (priceDelta): без них платные опции
  // (размер/цвет) недосчитываются. Метку «Группа: Значение · …» из cookie
  // сопоставляем с ProductVariant по (productId, name, value) — цену считаем на
  // сервере, не доверяя клиенту.
  const variantRows = await db.productVariant.findMany({
    where: { productId: { in: ids } },
  });
  const deltaByKey = new Map<string, number>();
  for (const v of variantRows) {
    deltaByKey.set(`${v.productId}|${v.name}|${v.value}`, v.priceDelta);
  }
  const variantDelta = (productId: string, label: string | undefined): number => {
    if (!label) return 0;
    let sum = 0;
    for (const part of label.split(" · ")) {
      const i = part.indexOf(": ");
      if (i < 0) continue;
      sum +=
        deltaByKey.get(`${productId}|${part.slice(0, i)}|${part.slice(i + 2)}`) ??
        0;
    }
    return sum;
  };

  // Math.max(0, …): вариант-скидка (отрицательный priceDelta) не должна уводить
  // цену позиции и итог в минус — у Order.totalRub/OrderItem.priceRub нет CHECK >= 0.
  const linePrice = lines.map((l) =>
    Math.max(0, l.product.priceRub + variantDelta(l.product.id, variants[l.product.id])),
  );
  const totalRub = linePrice.reduce((sum, p, i) => sum + p * lines[i].qty, 0);

  const order = await db.order.create({
    data: {
      userId: user?.id ?? null,
      name,
      phone,
      address: str(body.address, 400),
      totalRub,
      items: {
        create: lines.map((l, i) => ({
          productId: l.product.id,
          qty: l.qty,
          priceRub: linePrice[i],
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
