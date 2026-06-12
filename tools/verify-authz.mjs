// Регресс-сторож авторизации мутирующих роутов: защита от IDOR и эскалации прав.
// Код уже корректен (ревью 33-го прогона) — тест ФИКСИРУЕТ инварианты, чтобы
// будущий рефактор не открыл доступ к чужому/привилегированному молча.
//   • Модерация очереди жалоб — только модератор (ambassador/admin), не любой юзер.
//   • Буст / смена статуса / удаление — только владелец объекта.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};
const J = { "content-type": "application/json" };

const cleanup = {
  users: [],
  reports: [],
  losts: [],
  founds: [],
  healths: [],
  pets: [],
};
const mkSession = async (name, role = "user") => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({
    data: { name, email: `az+${name}-${Date.now()}@lapka.test`, role },
  });
  await db.session.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  cleanup.users.push(user.id);
  return { user, cookie: `lapka_session=${token}` };
};

try {
  const owner = await mkSession("AzOwner");
  const other = await mkSession("AzOther");
  const mod = await mkSession("AzMod", "admin");

  // 1. Модерация очереди жалоб — только модератор (защита от эскалации прав).
  const report = await db.report.create({
    data: { targetType: "post", targetId: "az-target", reason: "spam" },
  });
  cleanup.reports.push(report.id);
  const modPatch = (cookie) =>
    fetch(`${BASE}/api/moderation/${report.id}`, {
      method: "PATCH",
      headers: { ...J, cookie },
      body: JSON.stringify({ status: "dismissed" }),
    });
  ok((await modPatch(other.cookie)).status === 403, "модерация обычным юзером → 403 (нет эскалации прав)");
  ok((await modPatch(mod.cookie)).status === 200, "модерация модератором (admin) → 200");

  // 2. Буст чужого розыска → 403.
  const lost = await db.lostReport.create({
    data: { userId: owner.user.id, petName: "AzБуст", status: "active" },
  });
  cleanup.losts.push(lost.id);
  ok(
    (await fetch(`${BASE}/api/reports/${lost.id}/boost`, {
      method: "POST",
      headers: { ...J, cookie: other.cookie },
    })).status === 403,
    "буст чужого розыска → 403",
  );

  // 3. Смена статуса чужой находки → 404.
  const found = await db.foundReport.create({
    data: { userId: owner.user.id, breed: "AzНаходка", status: "open" },
  });
  cleanup.founds.push(found.id);
  ok(
    (await fetch(`${BASE}/api/found/${found.id}`, {
      method: "PATCH",
      headers: { ...J, cookie: other.cookie },
      body: JSON.stringify({ status: "reunited" }),
    })).status === 404,
    "смена статуса чужой находки → 404",
  );

  // 4. Удаление чужой записи дневника здоровья → 404.
  const pet = await db.pet.create({
    data: { userId: owner.user.id, name: "AzПёс" },
  });
  cleanup.pets.push(pet.id);
  const health = await db.healthRecord.create({
    data: { petId: pet.id, type: "vaccine", title: "AzПрививка", date: new Date() },
  });
  cleanup.healths.push(health.id);
  ok(
    (await fetch(`${BASE}/api/health/${health.id}`, {
      method: "DELETE",
      headers: { ...J, cookie: other.cookie },
    })).status === 404,
    "удаление чужой записи здоровья → 404",
  );
} finally {
  for (const id of cleanup.healths)
    await db.healthRecord.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.pets)
    await db.pet.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.founds)
    await db.foundReport.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.losts)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.reports)
    await db.report.delete({ where: { id } }).catch(() => {});
  for (const uid of cleanup.users) {
    await db.session.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.user.delete({ where: { id: uid } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
