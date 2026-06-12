// Самоочистка демо-БД от осиротевших тест-записей. Сьюты убирают за собой при
// НОРМАЛЬНОМ завершении; прерванный прогон (Ctrl+C / kill посреди сьюта) оставляет
// «Тест-…» карточки в живой ленте (поймано живым UI-тестом 12.06.2026). Запускается
// первым шагом verify-all и руками: node tools/verify-sweep.mjs
// ВАЖНО: паттерны строго однозначные (префиксы/имена сьютов) — реальные данные
// демо не трогаем; сомнительное (короткие имена вроде «Тест») НЕ удаляем.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const out = [];
const sweep = async (label, fn) => {
  try {
    const n = await fn();
    if (n > 0) out.push(`${label}: ${n}`);
  } catch (e) {
    out.push(`${label}: ошибка (${e.code ?? e.message})`);
  }
};

// — Розыски (lostReport) + их связи —
const lostWhere = {
  OR: [
    { petName: { in: ["Тест-Правка", "Тест-Потеряша", "Тест-Буст", "ФотоГард", "AzБуст"] } },
    { petName: { startsWith: "ХабРозыск-" } },
  ],
};
const lostIds = (
  await db.lostReport.findMany({ where: lostWhere, select: { id: true } }).catch(() => [])
).map((r) => r.id);
if (lostIds.length) {
  await sweep("наблюдения тест-розысков", () =>
    db.sighting.deleteMany({ where: { reportId: { in: lostIds } } }).then((r) => r.count));
  await sweep("подписки тест-розысков", () =>
    db.reportSubscription.deleteMany({ where: { reportId: { in: lostIds } } }).then((r) => r.count));
  await sweep("истории тест-розысков", () =>
    db.reunion.deleteMany({ where: { reportId: { in: lostIds } } }).then((r) => r.count));
  await sweep("тест-розыски", () =>
    db.lostReport.deleteMany({ where: { id: { in: lostIds } } }).then((r) => r.count));
}

// — Находки (foundReport) —
await sweep("тест-находки", () =>
  db.foundReport
    .deleteMany({
      where: {
        OR: [
          { breed: { in: ["ГардX", "ГардY", "AzНаходка", "E2E-TG-smoke"] } },
          { breed: { startsWith: "ХабНаходка-" } },
          { breed: { startsWith: "НаходкаТверская-" } },
          { breed: { startsWith: "НаходкаХамовники-" } },
          { finderName: "Тест-Нашёл" },
        ],
      },
    })
    .then((r) => r.count));

// — Истории воссоединения —
await sweep("тест-истории", () =>
  db.reunion.deleteMany({ where: { petName: { startsWith: "ХабДома-" } } }).then((r) => r.count));

// — Питомцы (после health-записей) —
const petWhere = {
  OR: [
    { name: { in: ["Тест-Барбос", "Тест-Рекс", "ФотоГардПёс", "ФотоГардОК", "AzПёс"] } },
    { name: { startsWith: "HashPet" } },
    { name: { startsWith: "SosHash" } },
  ],
};
const petIds = (
  await db.pet.findMany({ where: petWhere, select: { id: true } }).catch(() => [])
).map((p) => p.id);
if (petIds.length) {
  await sweep("health тест-питомцев", () =>
    db.healthRecord.deleteMany({ where: { petId: { in: petIds } } }).then((r) => r.count));
  await sweep("фото тест-питомцев", () =>
    db.petPhoto.deleteMany({ where: { petId: { in: petIds } } }).then((r) => r.count));
  await sweep("тест-питомцы", () =>
    db.pet.deleteMany({ where: { id: { in: petIds } } }).then((r) => r.count));
}

// — Заказы и e2e-товары магазина —
const orderIds = (
  await db.order
    .findMany({ where: { name: { in: ["Тест Чекаут", "Живой UI-тест"] } }, select: { id: true } })
    .catch(() => [])
).map((o) => o.id);
const e2eProductIds = (
  await db.product
    .findMany({ where: { slug: { startsWith: "e2e-var-" } }, select: { id: true } })
    .catch(() => [])
).map((p) => p.id);
if (orderIds.length || e2eProductIds.length) {
  await sweep("позиции тест-заказов", () =>
    db.orderItem
      .deleteMany({ where: { OR: [{ orderId: { in: orderIds } }, { productId: { in: e2eProductIds } }] } })
      .then((r) => r.count));
  await sweep("тест-заказы", () =>
    db.order.deleteMany({ where: { id: { in: orderIds } } }).then((r) => r.count));
  await sweep("варианты e2e-товаров", () =>
    db.productVariant.deleteMany({ where: { productId: { in: e2eProductIds } } }).then((r) => r.count));
  await sweep("e2e-товары", () =>
    db.product.deleteMany({ where: { id: { in: e2eProductIds } } }).then((r) => r.count));
}

// — Тест-пользователи (@lapka.test) — сессии/связи, затем сам пользователь.
const userIds = (
  await db.user
    .findMany({ where: { email: { endsWith: "@lapka.test" } }, select: { id: true } })
    .catch(() => [])
).map((u) => u.id);
if (userIds.length) {
  for (const t of ["session", "notification", "purchase", "passwordResetToken"]) {
    await sweep(`${t} тест-юзеров`, () =>
      db[t].deleteMany({ where: { userId: { in: userIds } } }).then((r) => r.count));
  }
  // Пользователя с другими FK (посты и т.п.) пропускаем — try/catch на каждом.
  let removed = 0;
  for (const id of userIds) {
    try {
      await db.user.delete({ where: { id } });
      removed++;
    } catch {
      /* остались FK — не наш случай, пропускаем */
    }
  }
  if (removed) out.push(`тест-юзеры: ${removed}`);
}

await db.$disconnect();
console.log(out.length ? `Сметено: ${out.join(" · ")}` : "Чисто — сирот нет.");
