// Проверка «Это моя собака»: владелец сообщает нашедшему о совпадении.
// auth-гейт, валидация, нельзя заявить свою находку, нашедший получает уведомление.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const J = { "content-type": "application/json" };

const mkSession = async (name) => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({ data: { name, email: `cl+${name}-${Date.now()}@lapka.test` } });
  await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) } });
  return { user, cookie: `lapka_session=${token}` };
};

const finder = await mkSession("Нашедший");
const owner = await mkSession("Хозяин");
const found = await db.foundReport.create({
  data: { userId: finder.user.id, status: "open", breed: "корги", district: "khamovniki" },
});
const claim = (cookie, message) =>
  fetch(`${BASE}/api/found/${found.id}/claim`, { method: "POST", headers: cookie ? { ...J, cookie } : J, body: JSON.stringify({ message }) });

ok((await claim(null, "Это моя собака, телефон +70000000001")).status === 401, "без сессии → 401");
ok((await claim(owner.cookie, "коротко")).status === 400, "слишком короткое сообщение → 400");
ok((await claim(finder.cookie, "Это моя находка, не должно пройти")).status === 400, "нельзя заявить свою находку → 400");

const okRes = await claim(owner.cookie, "Это моя Тиша! На левом ухе шрам. Телефон +70000000002");
ok(okRes.status === 200, `владелец → 200 (${okRes.status})`);

const notif = await db.notification.findFirst({
  where: { userId: finder.user.id, type: "found" }, orderBy: { createdAt: "desc" },
});
ok(!!notif && /нашёлся хозяин/i.test(notif.title || ""), "нашедший получил уведомление-заявку");
ok(!!notif && notif.body?.includes("Хозяин") && notif.body?.includes("шрам"), "в теле — имя заявителя и его сообщение");

await db.foundReport.delete({ where: { id: found.id } }).catch(() => {});
for (const s of [finder, owner]) {
  await db.notification.deleteMany({ where: { userId: s.user.id } }).catch(() => {});
  await db.session.deleteMany({ where: { userId: s.user.id } }).catch(() => {});
  await db.user.delete({ where: { id: s.user.id } }).catch(() => {});
}
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
