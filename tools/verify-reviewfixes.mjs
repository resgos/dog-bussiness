// Регресс-сторож для фиксов ревью старых роутов: инвалидация сессий при сбросе
// пароля, идемпотентность boost/plus, санитизация URL партнёра, IDOR историй,
// валидация наблюдений.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const J = { "content-type": "application/json" };
const cleanup = [];
const mkSession = async (name) => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({ data: { name, email: `rf+${name}-${Date.now()}@lapka.test` } });
  await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) } });
  cleanup.push(user.id);
  return { user, cookie: `lapka_session=${token}` };
};

// 1. Сброс пароля гасит активные сессии.
{
  const u = await mkSession("Reset");
  const rtok = randomBytes(24).toString("hex");
  await db.passwordResetToken.create({ data: { token: rtok, userId: u.user.id, expiresAt: new Date(Date.now() + 3600000) } });
  const res = await fetch(`${BASE}/api/auth/reset`, { method: "POST", headers: J, body: JSON.stringify({ token: rtok, password: "newpass123" }) });
  ok(res.status === 200, `reset → 200 (${res.status})`);
  ok((await db.session.count({ where: { userId: u.user.id } })) === 0, "сброс пароля гасит все сессии");
}

// 2. Boost идемпотентен.
{
  const u = await mkSession("Boost");
  const rep = await db.lostReport.create({ data: { userId: u.user.id, petName: "Тест-Буст", status: "active" } });
  await fetch(`${BASE}/api/reports/${rep.id}/boost`, { method: "POST", headers: { ...J, cookie: u.cookie } });
  const b2 = await fetch(`${BASE}/api/reports/${rep.id}/boost`, { method: "POST", headers: { ...J, cookie: u.cookie } });
  const b2j = await b2.json().catch(() => ({}));
  ok(b2.status === 200 && b2j.already === true, "повторный boost → already (без списания)");
  ok((await db.purchase.count({ where: { userId: u.user.id, kind: "boost" } })) === 1, "буст списан один раз");
  await db.lostReport.delete({ where: { id: rep.id } }).catch(() => {});
}

// 3. Plus идемпотентен.
{
  const u = await mkSession("Plus");
  await fetch(`${BASE}/api/plus/subscribe`, { method: "POST", headers: { ...J, cookie: u.cookie } });
  const p2 = await fetch(`${BASE}/api/plus/subscribe`, { method: "POST", headers: { ...J, cookie: u.cookie } });
  const p2j = await p2.json().catch(() => ({}));
  ok(p2.status === 200 && p2j.already === true, "повторный plus → already (без списания)");
  ok((await db.purchase.count({ where: { userId: u.user.id, kind: "plus" } })) === 1, "plus списан один раз");
}

// 4. URL партнёра санитизируется.
{
  const r1 = await fetch(`${BASE}/api/partners`, { method: "POST", headers: J, body: JSON.stringify({ name: "Тест-П1", type: "vet", url: "javascript:alert(1)" }) });
  const j1 = await r1.json().catch(() => ({}));
  if (j1.id) {
    ok((await db.partner.findUnique({ where: { id: j1.id } }))?.url === null, "javascript: URL вычищен в null");
    await db.partner.delete({ where: { id: j1.id } }).catch(() => {});
  } else ok(false, "partner #1 не создан");
  const r2 = await fetch(`${BASE}/api/partners`, { method: "POST", headers: J, body: JSON.stringify({ name: "Тест-П2", type: "vet", url: "vet-lapka.ru" }) });
  const j2 = await r2.json().catch(() => ({}));
  if (j2.id) {
    ok((await db.partner.findUnique({ where: { id: j2.id } }))?.url?.startsWith("https://"), "URL без схемы → https://");
    await db.partner.delete({ where: { id: j2.id } }).catch(() => {});
  } else ok(false, "partner #2 не создан");
}

// 5. История воссоединения не привязывается к ЧУЖОМУ розыску (IDOR).
{
  const a = await mkSession("ReunA");
  const bUser = await db.user.create({ data: { name: "ReunB", email: `rf+b-${Date.now()}@lapka.test` } });
  cleanup.push(bUser.id);
  const bRep = await db.lostReport.create({ data: { userId: bUser.id, petName: "Чужой", status: "active" } });
  const res = await fetch(`${BASE}/api/reunions`, { method: "POST", headers: { ...J, cookie: a.cookie }, body: JSON.stringify({ petName: "Тест", story: "Длинная история воссоединения собаки", reportId: bRep.id }) });
  const j = await res.json().catch(() => ({}));
  if (j.id) {
    ok((await db.reunion.findUnique({ where: { id: j.id } }))?.reportId === null, "чужой reportId отвязан");
    await db.reunion.delete({ where: { id: j.id } }).catch(() => {});
  } else ok(false, "reunion не создан");
  await db.lostReport.delete({ where: { id: bRep.id } }).catch(() => {});
}

// 6. Наблюдения: пустое тело → 400, несуществующий розыск → 404.
{
  ok((await fetch(`${BASE}/api/sightings`, { method: "POST", headers: J, body: "null" })).status === 400, "sightings пустое тело → 400");
  ok((await fetch(`${BASE}/api/sightings`, { method: "POST", headers: J, body: JSON.stringify({ reportId: "zzznope404", lat: 55.7, lng: 37.6 }) })).status === 404, "sightings несуществующий розыск → 404");
}

for (const uid of cleanup) {
  await db.notification.deleteMany({ where: { userId: uid } }).catch(() => {});
  await db.purchase.deleteMany({ where: { userId: uid } }).catch(() => {});
  await db.reunion.deleteMany({ where: { userId: uid } }).catch(() => {});
  await db.lostReport.deleteMany({ where: { userId: uid } }).catch(() => {});
  await db.passwordResetToken.deleteMany({ where: { userId: uid } }).catch(() => {});
  await db.session.deleteMany({ where: { userId: uid } }).catch(() => {});
  await db.user.delete({ where: { id: uid } }).catch(() => {});
}
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
