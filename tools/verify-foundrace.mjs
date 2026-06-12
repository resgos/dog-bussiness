// Идемпотентность разовых побочек при «Нашлась!»: помощник кредитуется РОВНО один
// раз за жизнь розыска, даже при reopen→re-found (compare-and-set по helpersCreditedAt).
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const J = { "content-type": "application/json" };

const token = randomBytes(32).toString("hex");
const owner = await db.user.create({ data: { name: "Влад", email: `fr+o${Date.now()}@lapka.test` } });
await db.session.create({ data: { token, userId: owner.id, expiresAt: new Date(Date.now() + 86400000) } });
const cookie = `lapka_session=${token}`;
const helper = await db.user.create({ data: { name: "Помощник", email: `fr+h${Date.now()}@lapka.test`, helpedCount: 3 } });
const rep = await db.lostReport.create({ data: { userId: owner.id, petName: "Тест-Рейс", status: "active", district: "khamovniki" } });
await db.sighting.create({ data: { reportId: rep.id, userId: helper.id, lat: 55.7, lng: 37.6 } });

const patch = (status) =>
  fetch(`${BASE}/api/reports/${rep.id}`, { method: "PATCH", headers: { ...J, cookie }, body: JSON.stringify({ status }) });

// Первая отметка «Нашлась!» → помощник +1.
await patch("found");
let h = await db.user.findUnique({ where: { id: helper.id } });
ok(h?.helpedCount === 4, `помощник кредитован +1 (helpedCount=${h?.helpedCount}, ждали 4)`);

// Реоупен и повторный found → кредит НЕ дублируется.
await patch("active");
await patch("found");
h = await db.user.findUnique({ where: { id: helper.id } });
ok(h?.helpedCount === 4, `повторный found не дублирует кредит (helpedCount=${h?.helpedCount}, ждали 4)`);

await db.sighting.deleteMany({ where: { reportId: rep.id } }).catch(() => {});
await db.notification.deleteMany({ where: { userId: { in: [owner.id, helper.id] } } }).catch(() => {});
await db.lostReport.delete({ where: { id: rep.id } }).catch(() => {});
await db.session.deleteMany({ where: { userId: owner.id } }).catch(() => {});
await db.user.deleteMany({ where: { id: { in: [owner.id, helper.id] } } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
