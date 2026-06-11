// Проверка редактирования своей находки: PUT /api/found/[id] (auth + ownership),
// обновление полей и страница /found/[id]/edit.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const J = { "content-type": "application/json" };

const mkSession = async (name) => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({ data: { name, email: `fe+${name}-${Date.now()}@lapka.test` } });
  await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) } });
  return { user, cookie: `lapka_session=${token}` };
};

const owner = await mkSession("Нашедший");
const other = await mkSession("Чужой");
const found = await db.foundReport.create({
  data: { userId: owner.user.id, status: "open", breed: "корги", district: "khamovniki", contactPhone: "+70000000001" },
});
const put = (cookie, body) =>
  fetch(`${BASE}/api/found/${found.id}`, { method: "PUT", headers: cookie ? { ...J, cookie } : J, body: JSON.stringify(body) });

ok((await put(null, { breed: "X" })).status === 401, "PUT без сессии → 401");
ok((await put(other.cookie, { breed: "X" })).status === 404, "чужая находка → 404");

const okRes = await put(owner.cookie, {
  breed: "метис", color: "чёрный", size: "medium", district: "khamovniki",
  finderName: "Аня", contactPhone: "+70000000002", comment: "у метро, в ошейнике",
});
ok(okRes.status === 200, "владелец → 200");
const row = await db.foundReport.findUnique({ where: { id: found.id } });
ok(row?.breed === "метис" && row?.finderName === "Аня" && row?.contactPhone === "+70000000002", "поля обновлены в БД");

// Страница редактирования гостю недоступна (404).
const editStatus = (await fetch(`${BASE}/found/${found.id}/edit`)).status;
ok(editStatus === 404, `страница /found/[id]/edit гостю → 404 (получено ${editStatus})`);

// Детальная показывает обновлённую породу.
const detail = await (await fetch(`${BASE}/found/${found.id}`)).text();
ok(detail.includes("метис"), "детальная показывает обновлённую породу");

await db.foundReport.delete({ where: { id: found.id } }).catch(() => {});
for (const s of [owner, other]) {
  await db.session.deleteMany({ where: { userId: s.user.id } }).catch(() => {});
  await db.user.delete({ where: { id: s.user.id } }).catch(() => {});
}
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
