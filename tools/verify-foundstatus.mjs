// Проверка жизненного цикла находки: владелец помечает «Хозяин нашёлся» (reunited).
// auth-гейт, ownership, смена статуса и отражение на странице.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const mkSession = async (name) => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({ data: { name, email: `fs+${name}-${Date.now()}@lapka.test` } });
  await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) } });
  return { user, cookie: `lapka_session=${token}` };
};
const J = { "content-type": "application/json" };

const owner = await mkSession("Нашедший");
const other = await mkSession("Чужой");
const found = await db.foundReport.create({
  data: { status: "open", userId: owner.user.id, breed: "корги", district: "khamovniki", finderName: "Нашедший" },
});

// Без сессии → 401.
const anon = await fetch(`${BASE}/api/found/${found.id}`, { method: "PATCH", headers: J, body: JSON.stringify({ status: "reunited" }) });
ok(anon.status === 401, `PATCH без сессии → 401 (${anon.status})`);

// Чужой → 404.
const foreign = await fetch(`${BASE}/api/found/${found.id}`, { method: "PATCH", headers: { ...J, cookie: other.cookie }, body: JSON.stringify({ status: "reunited" }) });
ok(foreign.status === 404, `чужая находка → 404 (${foreign.status})`);

// Владелец → 200 reunited.
const okRes = await fetch(`${BASE}/api/found/${found.id}`, { method: "PATCH", headers: { ...J, cookie: owner.cookie }, body: JSON.stringify({ status: "reunited" }) });
const okJson = await okRes.json().catch(() => ({}));
ok(okRes.status === 200 && okJson.status === "reunited", "владелец → 200 {status:reunited}");
const row = await db.foundReport.findUnique({ where: { id: found.id } });
ok(row?.status === "reunited", "статус reunited сохранён в БД");

// Страница находки показывает «Воссоединились».
const detail = await (await fetch(`${BASE}/found/${found.id}`)).text();
ok(detail.includes("Воссоединились"), "на /found/[id] бейдж «Воссоединились»");

// Очистка.
await db.foundReport.delete({ where: { id: found.id } }).catch(() => {});
for (const s of [owner, other]) {
  await db.session.deleteMany({ where: { userId: s.user.id } }).catch(() => {});
  await db.user.delete({ where: { id: s.user.id } }).catch(() => {});
}
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
