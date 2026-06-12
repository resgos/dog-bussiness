// Сторож ценообразования вариантов в чекауте: надбавка priceDelta выбранных
// опций (размер/цвет) должна попадать и в Order.totalRub, и в OrderItem.priceRub.
// Цену считаем на сервере по cookie-метке «Группа: Значение · …», не доверяя клиенту.
// Плюс: вариант-скидка (отрицательный priceDelta) не уводит цену/итог в минус.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};
const J = { "content-type": "application/json" };

const stamp = Date.now();
// Товар A с двумя группами вариантов: надбавки 200 + 50 = 250.
const A = await db.product.create({
  data: { slug: `e2e-var-a-${stamp}`, name: "Тест-Вариант-A", category: "merch", priceRub: 1000 },
});
await db.productVariant.create({
  data: { productId: A.id, name: "Размер", value: "L", priceDelta: 200, order: 0 },
});
await db.productVariant.create({
  data: { productId: A.id, name: "Цвет", value: "Синий", priceDelta: 50, order: 1 },
});
// Товар B без вариантов — базовая цена не должна измениться (регресс-страховка).
const B = await db.product.create({
  data: { slug: `e2e-var-b-${stamp}`, name: "Тест-Вариант-B", category: "merch", priceRub: 500 },
});
// Товар C с вариант-скидкой больше базовой цены (1000 − 2000) — проверяем клэмп до 0.
const C = await db.product.create({
  data: { slug: `e2e-var-c-${stamp}`, name: "Тест-Вариант-C", category: "merch", priceRub: 1000 },
});
await db.productVariant.create({
  data: { productId: C.id, name: "Скидка", value: "VIP", priceDelta: -2000, order: 0 },
});

const ids = [A.id, B.id, C.id];
const cleanupProducts = async () => {
  await db.orderItem.deleteMany({ where: { productId: { in: ids } } }).catch(() => {});
  await db.productVariant.deleteMany({ where: { productId: { in: ids } } }).catch(() => {});
  await db.product.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
};

const orders = [];
const checkout = async (cart, vars) => {
  const cookie = `lapka_cart=${encodeURIComponent(JSON.stringify(cart))}; lapka_cart_variants=${encodeURIComponent(JSON.stringify(vars))}`;
  const res = await fetch(`${BASE}/api/shop/checkout`, {
    method: "POST",
    headers: { ...J, cookie },
    body: JSON.stringify({ name: "Тест Чекаут", phone: "+70000000000" }),
  });
  const j = await res.json().catch(() => ({}));
  if (j.orderId) orders.push(j.orderId);
  return { res, j };
};

try {
  // Сценарий 1: надбавки вариантов учитываются, товар без вариантов не меняется.
  {
    const { res, j } = await checkout(
      { [A.id]: 2, [B.id]: 1 },
      { [A.id]: "Размер: L · Цвет: Синий" },
    );
    ok(res.status === 201 && Boolean(j.orderId), `checkout #1 → 201 + orderId (${res.status})`);
    if (j.orderId) {
      const order = await db.order.findUnique({ where: { id: j.orderId }, include: { items: true } });
      // A (1000+250)×2 = 2500, B 500×1 = 500, итог 3000.
      ok(order?.totalRub === 3000, `итог учитывает надбавки: ${order?.totalRub} (ждали 3000)`);
      const itemA = order?.items.find((i) => i.productId === A.id);
      const itemB = order?.items.find((i) => i.productId === B.id);
      ok(itemA?.priceRub === 1250, `priceRub варианта A = база+250: ${itemA?.priceRub} (ждали 1250)`);
      ok(
        itemA?.variant === "Размер: L · Цвет: Синий",
        `метка варианта A сохранена: ${itemA?.variant ?? "—"}`,
      );
      ok(itemB?.priceRub === 500, `priceRub без вариантов B неизменна: ${itemB?.priceRub} (ждали 500)`);
      ok(order?.items.length === 2, `в заказе обе позиции: ${order?.items.length} (ждали 2)`);
    }
  }

  // Сценарий 2: вариант-скидка не уводит цену/итог в минус (клэмп до 0).
  {
    const { res, j } = await checkout({ [C.id]: 1 }, { [C.id]: "Скидка: VIP" });
    ok(res.status === 201 && Boolean(j.orderId), `checkout #2 → 201 + orderId (${res.status})`);
    if (j.orderId) {
      const order = await db.order.findUnique({ where: { id: j.orderId }, include: { items: true } });
      ok(order?.totalRub === 0, `скидка > цены → итог 0, не минус: ${order?.totalRub} (ждали 0)`);
      ok(order?.items[0]?.priceRub === 0, `priceRub позиции клэмпнут до 0: ${order?.items[0]?.priceRub}`);
    }
  }
} finally {
  for (const id of orders) {
    await db.orderItem.deleteMany({ where: { orderId: id } }).catch(() => {});
    await db.order.delete({ where: { id } }).catch(() => {});
  }
  await cleanupProducts();
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
