// Проверка нуджа: при отметке пропажи «Нашлась!» владелец получает приглашение
// рассказать историю воссоединения со ссылкой на предзаполненную форму.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const J = { "content-type": "application/json" };

const token = randomBytes(32).toString("hex");
const owner = await db.user.create({ data: { name: "Владелец", email: `rn+${Date.now()}@lapka.test` } });
await db.session.create({ data: { token, userId: owner.id, expiresAt: new Date(Date.now() + 86400000) } });
const cookie = `lapka_session=${token}`;
const rep = await db.lostReport.create({
  data: { userId: owner.id, petName: "Тест-Возврат", status: "active", district: "khamovniki" },
});

// Отмечаем найденной.
const res = await fetch(`${BASE}/api/reports/${rep.id}`, {
  method: "PATCH", headers: { ...J, cookie }, body: JSON.stringify({ status: "found" }),
});
ok(res.status === 200, `PATCH status=found → 200 (${res.status})`);

const notif = await db.notification.findFirst({
  where: { userId: owner.id, type: "found" }, orderBy: { createdAt: "desc" },
});
ok(!!notif && /reunited\/new/.test(notif.link || ""), "владелец получил нудж со ссылкой на /reunited/new");
ok(!!notif && /(Поздравляем|нашлась)/i.test(notif.title || ""), "заголовок-поздравление");

// Форма истории предзаполняется кличкой из ссылки.
const form = await (await fetch(`${BASE}/reunited/new?petName=${encodeURIComponent("Тест-Возврат")}`, { headers: { cookie } })).text();
ok(form.includes("Тест-Возврат"), "форма истории предзаполнена кличкой");

await db.notification.deleteMany({ where: { userId: owner.id } }).catch(() => {});
await db.lostReport.delete({ where: { id: rep.id } }).catch(() => {});
await db.session.deleteMany({ where: { userId: owner.id } }).catch(() => {});
await db.user.delete({ where: { id: owner.id } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
