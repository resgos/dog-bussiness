// Проверка редактирования своего объявления о пропаже: PUT /api/reports/[id]
// (auth + ownership), обновление полей и страница /lost/[id]/edit.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const J = { "content-type": "application/json" };

const mkSession = async (name) => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({ data: { name, email: `le+${name}-${Date.now()}@lapka.test` } });
  await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) } });
  return { user, cookie: `lapka_session=${token}` };
};

const owner = await mkSession("Хозяин");
const other = await mkSession("Чужой");
const rep = await db.lostReport.create({
  data: { userId: owner.user.id, petName: "Тест-Правка", status: "active", breed: "корги", district: "khamovniki" },
});
const put = (cookie, body) =>
  fetch(`${BASE}/api/reports/${rep.id}`, { method: "PUT", headers: cookie ? { ...J, cookie } : J, body: JSON.stringify(body) });

ok((await put(null, { petName: "X" })).status === 401, "PUT без сессии → 401");
ok((await put(other.cookie, { petName: "X" })).status === 404, "чужое объявление → 404");

const okRes = await put(owner.cookie, {
  petName: "Тест-Правка", breed: "метис", color: "чёрный", size: "medium",
  district: "khamovniki", reward: 7000, comment: "новые приметы",
});
ok(okRes.status === 200, "владелец → 200");
const row = await db.lostReport.findUnique({ where: { id: rep.id } });
ok(row?.breed === "метис" && row?.reward === 7000 && row?.comment === "новые приметы", "поля обновлены в БД");

// Пустая кличка → 400.
ok((await put(owner.cookie, { petName: "  " })).status === 400, "пустая кличка → 400");

// Страница редактирования гостю недоступна (404).
ok((await fetch(`${BASE}/lost/${rep.id}/edit`)).status === 404, "страница /lost/[id]/edit гостю → 404");

// Детальная показывает обновлённую породу.
const detail = await (await fetch(`${BASE}/lost/${rep.id}`)).text();
ok(detail.includes("метис"), "детальная показывает обновлённую породу");

await db.lostReport.delete({ where: { id: rep.id } }).catch(() => {});
for (const s of [owner, other]) {
  await db.session.deleteMany({ where: { userId: s.user.id } }).catch(() => {});
  await db.user.delete({ where: { id: s.user.id } }).catch(() => {});
}
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
