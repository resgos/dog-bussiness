// Проверка проактивного алерта: при подаче SOS нашедшие совпавших ОТКРЫТЫХ находок
// получают уведомление (симметрично /api/found). Несовпавшие — не получают.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const J = { "content-type": "application/json" };

const mkSession = async (name) => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({ data: { name, email: `sm+${name}-${Date.now()}@lapka.test` } });
  await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) } });
  return { user, cookie: `lapka_session=${token}` };
};

const DIST = "e2e-sosmatch";
const finderMatch = await mkSession("НашедшийСовпал");
const finderOther = await mkSession("НашедшийНе");
const owner = await mkSession("Хозяин");

// Открытые находки СУЩЕСТВУЮТ до подачи SOS, чтобы кросс-матч их увидел.
const fMatch = await db.foundReport.create({
  data: { userId: finderMatch.user.id, status: "open", breed: "корги", district: DIST },
});
const fOther = await db.foundReport.create({
  data: { userId: finderOther.user.id, status: "open", breed: "хаски", district: "e2e-elsewhere" },
});

// Подаём SOS (район+порода совпадают с fMatch → score 65 ≥ 40; fOther — 0).
const res = await fetch(`${BASE}/api/sos`, {
  method: "POST", headers: { ...J, cookie: owner.cookie },
  body: JSON.stringify({ petName: "Тест-SOS-Матч", breed: "корги", district: DIST }),
});
const created = await res.json().catch(() => ({}));
ok(res.status === 201 && created.id, `POST /api/sos → 201 (${res.status})`);

const notifMatch = await db.notification.findFirst({
  where: { userId: finderMatch.user.id, type: "found" }, orderBy: { createdAt: "desc" },
});
ok(!!notifMatch && /ищут/.test(notifMatch.title), "нашедший совпавшей находки получил алерт");

const notifOther = await db.notification.findFirst({
  where: { userId: finderOther.user.id, type: "found" },
});
ok(!notifOther, "нашедший НЕсовпавшей находки — без алерта");

// Очистка.
if (created.id) await db.lostReport.delete({ where: { id: created.id } }).catch(() => {});
await db.foundReport.deleteMany({ where: { id: { in: [fMatch.id, fOther.id] } } }).catch(() => {});
for (const s of [finderMatch, finderOther, owner]) {
  await db.notification.deleteMany({ where: { userId: s.user.id } }).catch(() => {});
  await db.session.deleteMany({ where: { userId: s.user.id } }).catch(() => {});
  await db.user.delete({ where: { id: s.user.id } }).catch(() => {});
}
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
