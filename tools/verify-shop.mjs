// Магазин (Волна 2): рендер галереи/вариантов на странице товара + сквозное
// проведение выбранного варианта корзина → OrderItem.variant.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const cookieFrom = (res) => (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const product = await db.product.findFirst({ include: { variants: true, images: true } });
ok(Boolean(product), `есть товар для теста (${product?.slug})`);
ok(product.variants.length > 0 && product.images.length > 0, `у товара есть варианты(${product.variants.length}) и доп.фото(${product.images.length})`);

console.log("\n— Страница товара: галерея + параметры —");
let r = await fetch(`${BASE}/shop/product/${product.slug}`);
const html = await r.text();
ok(r.status === 200, `страница товара → ${r.status}`);
ok(html.includes("Цвет") && html.includes("Размер"), "показаны группы параметров «Цвет» и «Размер»");
ok(html.includes("Розовый"), "показано значение варианта «Розовый»");
ok(html.includes("merch-tags") || html.includes("pose-happy"), "в галерее есть доп. изображение");

console.log("\n— Сквозное: вариант корзина → заказ —");
const label = "Цвет: Розовый · Размер: M";
const addRes = await fetch(`${BASE}/api/shop/cart`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, op: "add", variant: label }) });
ok(addRes.status === 200, `add в корзину → ${addRes.status}`);
const cookie = cookieFrom(addRes);
ok(/lapka_cart=/.test(cookie) && /lapka_cart_variants=/.test(cookie), "выставлены cookie корзины и вариантов");
const coRes = await fetch(`${BASE}/api/shop/checkout`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ name: "Тест", phone: "+7 (900) 000-00-00" }) });
const coJson = await coRes.json();
ok(coRes.status === 201 && coJson.orderId, `checkout создал заказ → ${coRes.status}`);
const items = await db.orderItem.findMany({ where: { orderId: coJson.orderId } });
ok(items.length === 1 && items[0].variant === label, `OrderItem.variant сохранён: «${items[0]?.variant}»`);

console.log("\n— Уборка —");
await db.orderItem.deleteMany({ where: { orderId: coJson.orderId } });
await db.order.deleteMany({ where: { id: coJson.orderId } });
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
