// Полный E2E-прогон интерактивных флоу против ЖИВОГО сервера (:3002) с реальными
// транзакциями: регистрация-сессия, питомец+правка, SOS, находка, наблюдение,
// подписки, буст, статус, сообщество (пост/лайк/коммент), магазин (корзина→заказ),
// пристройство, история спасения, партнёр B2B, Лапка+, дневник здоровья, чек-лист,
// прогулка, уведомления, жалоба, удаление аккаунта. Демо-оплаты — моки (Purchase).
//
// Запуск: node tools/e2e-flows.mjs   (сервер dev должен быть поднят на 3002)
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();
const BASE = "http://localhost:3002";
const J = { "content-type": "application/json" };
const STAMP = Date.now();
const DIST = "e2e-testovo"; // синтетический район: не триггерит рассылку реальным соседям

let pass = 0, fail = 0;
const results = [];
const ok = (cond, msg) => {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ FAIL ${msg}`); results.push(msg); }
};
const section = (t) => console.log(`\n── ${t}`);

async function post(path, body, headers = J) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST", headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null; try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json, res };
}
async function patch(path, body, headers = J) {
  const res = await fetch(`${BASE}${path}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json, res };
}
async function del(path, headers = J) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json, res };
}
async function getText(path, headers = {}) {
  const res = await fetch(`${BASE}${path}`, { headers, redirect: "manual" });
  const text = await res.text().catch(() => "");
  return { status: res.status, text, res };
}
function cookiesFrom(res) {
  const arr = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")] : []);
  return arr.map((c) => c.split(";")[0]);
}

// ── трекинг для очистки
let uid = null;            // основной тест-юзер
const adoptionIds = [];
const partnerIds = [];
const lostIds = [];

async function main() {
  // ── 0. Сессия (регистрация = вставка User+Session, как делает createSession)
  section("0. Аутентификация и сессия");
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({
    data: { name: "E2E Тестов", email: `e2e+${STAMP}@lapka.test`, district: DIST, role: "user" },
  });
  uid = user.id;
  await db.session.create({
    data: { token, userId: uid, expiresAt: new Date(Date.now() + 86400_000) },
  });
  const auth = { ...J, cookie: `lapka_session=${token}` };

  // auth-гейт: защищённый эндпоинт без cookie = 401, с cookie = 200
  const walkAnon = await post("/api/walk", { lat: 55.7, lng: 37.6 });
  ok(walkAnon.status === 401, `/api/walk без сессии → 401 (получено ${walkAnon.status})`);
  const walkAuth = await post("/api/walk", { lat: 55.7, lng: 37.6 }, auth);
  ok(walkAuth.status === 200 && walkAuth.json?.ok, `/api/walk с сессией → 200 ok`);
  const walkRow = await db.walkCheckin.findFirst({ where: { userId: uid } });
  ok(!!walkRow, "WalkCheckin создан в БД");
  const walkEnd = await del("/api/walk", auth);
  ok(walkEnd.status === 200, "завершить прогулку (DELETE /api/walk) → 200");

  // ── 1. Питомец: создание привязано к владельцу (баг-фикс) + правка
  section("1. Питомец: создание + владелец + правка");
  const petRes = await post("/api/pets", { name: "Тест-Барбос", breed: "корги", color: "рыжий", district: DIST }, auth);
  ok(petRes.status === 201 && petRes.json?.id, `POST /api/pets → 201 {id}`);
  const petId = petRes.json?.id;
  if (petId) {
    const petRow = await db.pet.findUnique({ where: { id: petId } });
    ok(petRow?.userId === uid, "питомец привязан к владельцу (userId выставлен) — баг-фикс");
    const pass1 = await getText(`/p/${petId}`);
    ok(pass1.status === 200 && pass1.text.includes("Тест-Барбос"), "паспорт /p/[id] рендерит кличку");
    const editRes = await patch(`/api/pets/${petId}`, { name: "Тест-Рекс", breed: "корги" }, auth);
    ok(editRes.status === 200 && editRes.json?.ok, "владелец правит питомца (PATCH) → 200 (раньше был 404)");
    const renamed = await db.pet.findUnique({ where: { id: petId } });
    ok(renamed?.name === "Тест-Рекс", "правка сохранилась в БД");
  }

  // ── 2. SOS / пропажа
  section("2. Экстренный розыск (SOS)");
  const sos = await post("/api/sos", {
    petName: "Тест-Потеряша", breed: "корги", district: DIST, radiusKm: 3,
    comment: "тестовая пропажа", lat: 55.74, lng: 37.59,
  }, auth);
  ok(sos.status === 201 && sos.json?.id, "POST /api/sos → 201 {id}");
  const lostId = sos.json?.id;
  if (lostId) {
    lostIds.push(lostId);
    const lostRow = await db.lostReport.findUnique({ where: { id: lostId } });
    ok(lostRow?.status === "active" && lostRow?.userId === uid, "LostReport active и привязан к юзеру");
    const feed = await getText("/feed/lost");
    ok(feed.status === 200 && feed.text.includes("Тест-Потеряша"), "лента /feed/lost показывает пропажу");
    const detail = await getText(`/lost/${lostId}`);
    ok(detail.status === 200 && detail.text.includes("Тест-Потеряша"), "детальная /lost/[id] рендерит");
    const poster = await getText(`/poster/${lostId}`);
    ok(poster.status === 200 && poster.text.includes("Тест-Потеряша"), "плакат /poster/[id] рендерит");
  }

  // ── 3. Находка
  section("3. Находка");
  const found = await post("/api/found", {
    finderName: "Тест-Нашёл", contactPhone: "+70000000007", breed: "корги", color: "рыжий",
    size: "small", district: DIST, comment: "тестовая находка",
  }, auth);
  ok(found.status === 201 && found.json?.id, "POST /api/found → 201 {id}");
  const foundId = found.json?.id;
  if (foundId) {
    const fRow = await db.foundReport.findUnique({ where: { id: foundId } });
    ok(fRow?.status === "open", "FoundReport open в БД");
    const ffeed = await getText("/feed/found");
    ok(ffeed.status === 200, "лента /feed/found открывается");
    const fdetail = await getText(`/found/${foundId}`);
    ok(fdetail.status === 200, "детальная /found/[id] рендерит");
    // подписка на находку (toggle)
    const sub1 = await post(`/api/found/${foundId}/subscribe`, undefined, auth);
    ok(sub1.status === 200 && sub1.json?.following === true, "подписка на находку → following:true");
    const sub2 = await post(`/api/found/${foundId}/subscribe`, undefined, auth);
    ok(sub2.status === 200 && sub2.json?.following === false, "повтор → отписка following:false");
  }

  // ── 4. Наблюдение (чек-ин на карте)
  section("4. Наблюдение на карте");
  if (lostId) {
    const sight = await post("/api/sightings", {
      reportId: lostId, lat: 55.741, lng: 37.591, comment: "видели у парка E2E",
    }, auth);
    ok(sight.status === 201 && sight.json?.id, "POST /api/sightings → 201 {id}");
    const sRow = await db.sighting.findFirst({ where: { reportId: lostId } });
    ok(!!sRow, "Sighting создан в БД");
    const detail = await getText(`/lost/${lostId}`);
    ok(detail.text.includes("видели у парка E2E"), "наблюдение видно на /lost/[id]");
  }

  // ── 5. Подписка на розыск + чек-лист поиска
  section("5. Подписка на розыск + чек-лист");
  if (lostId) {
    const rsub = await post(`/api/reports/${lostId}/subscribe`, undefined, auth);
    ok(rsub.status === 200 && typeof rsub.json?.following === "boolean", "подписка на розыск → following");
    const chk = await post("/api/checklist", { reportId: lostId, steps: ["call_police", "post_social"] }, auth);
    ok(chk.status === 200 && chk.json?.ok, "сохранение чек-листа поиска → 200 ok");
  }

  // ── 6. Буст (демо-оплата) + смена статуса
  section("6. Буст (мок-оплата) + статус");
  if (lostId) {
    const boost = await post(`/api/reports/${lostId}/boost`, undefined, auth);
    ok(boost.status === 200 && boost.json?.boostedUntil, "буст → 200 {boostedUntil}");
    const purch = await db.purchase.findFirst({ where: { userId: uid, kind: "boost" } });
    ok(purch?.amountRub === 299, "Purchase(boost, 299₽) залогирован (демо-оплата)");
    const st = await patch(`/api/reports/${lostId}`, { status: "found" }, auth);
    ok(st.status === 200 && st.json?.status === "found", "смена статуса розыска → found");
    const lr = await db.lostReport.findUnique({ where: { id: lostId } });
    ok(lr?.status === "found", "статус found сохранён в БД");
  }

  // ── 7. Сообщество: пост → лайк → коммент
  section("7. Сообщество: пост / лайк / коммент");
  const postR = await post("/api/community/posts", { text: "Тестовый пост сообщества E2E", district: DIST }, auth);
  ok(postR.status === 201 && postR.json?.id, "создать пост → 201 {id}");
  const postId = postR.json?.id;
  if (postId) {
    const community = await getText("/community");
    ok(community.status === 200, "/community открывается");
    const like = await post(`/api/community/posts/${postId}/like`, undefined, auth);
    ok(like.status === 200 && like.json?.liked === true && like.json?.likes >= 1, "лайк поста → liked:true, likes≥1");
    const comm = await post(`/api/community/posts/${postId}/comments`, { text: "Тестовый комментарий E2E" }, auth);
    ok(comm.status === 201 && comm.json?.id, "комментарий к посту → 201 {id}");
    // жалоба на пост
    const rep = await post("/api/report", { targetType: "post", targetId: postId, reason: "spam" }, auth);
    ok(rep.status === 201 && rep.json?.ok, "жалоба на пост → 201 ok");
  }

  // ── 8. Магазин: корзина → заказ (cookie-корзина)
  section("8. Магазин: корзина → заказ");
  const product = await db.product.findFirst({ select: { id: true, slug: true, priceRub: true } });
  if (!product) {
    console.log("  ⚠ нет товаров в БД — флоу магазина пропущен");
  } else {
    const prod = await getText(`/shop/product/${product.slug}`);
    ok(prod.status === 200, "страница товара /shop/product/[slug] открывается");
    const cart = await post("/api/shop/cart", { productId: product.id, op: "add", qty: 2 });
    ok(cart.status === 200 && cart.json?.count >= 1, "добавление в корзину → count≥1");
    const cartCookies = cookiesFrom(cart.res);
    const coHeaders = { ...J, cookie: cartCookies.join("; ") };
    const checkout = await post("/api/shop/checkout", {
      name: "Тест Покупатель", phone: "+70000000008", address: "Москва, тестовая 1",
    }, coHeaders);
    ok(checkout.status === 201 && checkout.json?.orderId, "оформление заказа → 201 {orderId}");
    if (checkout.json?.orderId) {
      const order = await db.order.findUnique({
        where: { id: checkout.json.orderId }, include: { items: true },
      });
      ok(order && order.items.length > 0 && order.totalRub > 0, "Order + OrderItem с суммой созданы в БД");
    }
  }

  // ── 9. Пристройство
  section("9. Пристройство (adoption)");
  const adopt = await post("/api/adoption", {
    name: "Тест-Пушок", breed: "метис", size: "medium", district: DIST,
    story: "добрый пёс ищет дом", contactPhone: "+70000000006",
  }, auth);
  ok(adopt.status === 201 && adopt.json?.id, "POST /api/adoption → 201 {id}");
  if (adopt.json?.id) {
    adoptionIds.push(adopt.json.id);
    const ap = await getText("/adoption");
    ok(ap.status === 200, "/adoption открывается");
  }

  // ── 10. История спасения (reunion)
  section("10. История спасения (reunion)");
  const reun = await post("/api/reunions", {
    petName: "Тест-Найдёныш", story: "нашли через 3 дня поисков, спасибо соседям!", district: DIST,
  }, auth);
  ok((reun.status === 200 || reun.status === 201) && reun.json?.id, "POST /api/reunions → ok {id}");
  const reunited = await getText("/reunited");
  ok(reunited.status === 200, "/reunited открывается");

  // ── 11. Партнёр B2B
  section("11. Партнёр B2B (partners)");
  const partner = await post("/api/partners", {
    name: "Тест-ВетКлиника", type: "vet", district: DIST, phone: "+70000000005",
  }, auth);
  ok(partner.status === 201 && partner.json?.id, "POST /api/partners → 201 {id}");
  if (partner.json?.id) partnerIds.push(partner.json.id);

  // ── 12. Лапка+ (демо-оплата подписки)
  section("12. Подписка Лапка+ (мок-оплата)");
  const plus = await post("/api/plus/subscribe", undefined, auth);
  ok(plus.status === 200 && plus.json?.planUntil, "Лапка+ → 200 {planUntil}");
  const me = await db.user.findUnique({ where: { id: uid } });
  ok(me?.plan === "plus", "User.plan = plus в БД");
  const plusPurch = await db.purchase.findFirst({ where: { userId: uid, kind: "plus" } });
  ok(plusPurch?.amountRub === 199, "Purchase(plus, 199₽) залогирован (демо-оплата)");

  // ── 13. Дневник здоровья
  section("13. Дневник здоровья");
  if (petId) {
    const hp = await post("/api/health", {
      petId, type: "vaccine", title: "Прививка от бешенства", date: "2026-01-15",
    }, auth);
    ok(hp.status === 201 && hp.json?.ok, "добавить запись здоровья → 201 ok");
    const hr = await db.healthRecord.findFirst({ where: { petId } });
    ok(!!hr, "HealthRecord создан в БД");
    if (hr) {
      const hd = await del(`/api/health/${hr.id}`, auth);
      ok(hd.status === 200 && hd.json?.ok, "удалить запись здоровья → 200 ok");
    }
  }

  // ── 14. Уведомления: отметить прочитанными
  section("14. Уведомления");
  await db.notification.create({
    data: { userId: uid, type: "sos", title: "тест", body: "тело", link: "/feed/lost" },
  });
  const nread = await post("/api/notifications/read", {}, auth);
  ok(nread.status === 200 && nread.json?.ok, "отметить уведомления прочитанными → 200 ok");
  const unread = await db.notification.count({ where: { userId: uid, read: false } });
  ok(unread === 0, "непрочитанных уведомлений не осталось");

  // ── 15. Удаление аккаунта (на отдельном одноразовом юзере)
  section("15. Удаление аккаунта (право на забвение)");
  const dToken = randomBytes(32).toString("hex");
  const dUser = await db.user.create({
    data: { name: "Удаляемый", email: `e2e-del+${STAMP}@lapka.test`, district: DIST },
  });
  await db.session.create({ data: { token: dToken, userId: dUser.id, expiresAt: new Date(Date.now() + 86400_000) } });
  const delAcc = await post("/api/account/delete", {}, { ...J, cookie: `lapka_session=${dToken}` });
  ok(delAcc.status === 200 && delAcc.json?.ok, "POST /api/account/delete → 200 ok");
  const gone = await db.user.findUnique({ where: { id: dUser.id } });
  ok(gone === null, "пользователь и его данные удалены из БД");
}

async function cleanup() {
  if (!uid) return;
  try {
    // зависимые сущности → затем корневые
    await db.orderItem.deleteMany({ where: { order: { userId: uid } } }).catch(() => {});
    await db.order.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.purchase.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.comment.deleteMany({ where: { authorId: uid } }).catch(() => {});
    await db.postLike.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.post.deleteMany({ where: { authorId: uid } }).catch(() => {});
    await db.report.deleteMany({ where: { reporterId: uid } }).catch(() => {});
    await db.sighting.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.reportSubscription.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.foundSubscription.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.foundEvent.deleteMany({ where: { reportId: { in: lostIds } } }).catch(() => {});
    await db.healthRecord.deleteMany({ where: { pet: { userId: uid } } }).catch(() => {});
    await db.walkCheckin.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.reunion.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.notification.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.lostReport.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.foundReport.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.petPhoto.deleteMany({ where: { pet: { userId: uid } } }).catch(() => {});
    await db.pet.deleteMany({ where: { userId: uid } }).catch(() => {});
    for (const id of adoptionIds) await db.adoptionListing.delete({ where: { id } }).catch(() => {});
    for (const id of partnerIds) await db.partner.delete({ where: { id } }).catch(() => {});
    await db.session.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.user.delete({ where: { id: uid } }).catch(() => {});
  } catch (e) {
    console.log(`  ⚠ очистка частично не удалась: ${e.message}`);
  }
}

try {
  await main();
} catch (e) {
  fail++;
  console.log(`\n✗ ИСКЛЮЧЕНИЕ: ${e.stack || e.message}`);
} finally {
  await cleanup();
  await db.$disconnect();
}

console.log(`\n${"═".repeat(40)}`);
console.log(`Итог E2E: ${pass} ✓ / ${fail} ✗`);
if (results.length) console.log(`Провалы:\n - ${results.join("\n - ")}`);
process.exit(fail ? 1 : 0);
