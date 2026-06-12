// Сторож гостевого SOS и приватности селектора питомцев:
//   • гость на /sos видит быструю заявку (кличка/порода/район), а НЕ чужих питомцев;
//   • владелец видит ТОЛЬКО своих питомцев (не питомцев другого юзера);
//   • POST /api/sos без petId (гость) создаёт розыск — закрепляем поведение.
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

const cleanup = { users: [], pets: [], losts: [] };
const mkOwner = async (name, petName) => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({
    data: { name, email: `gs+${name}-${Date.now()}@lapka.test` },
  });
  await db.session.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  const pet = await db.pet.create({
    data: { userId: user.id, name: petName, breed: "корги", district: "tverskoy" },
  });
  cleanup.users.push(user.id);
  cleanup.pets.push(pet.id);
  return { user, pet, cookie: `lapka_session=${token}` };
};

try {
  const a = await mkOwner("ГостьСосA", "Тест-Барбос");
  const b = await mkOwner("ГостьСосB", "Тест-Рекс");

  // 1. Гость: быстрая заявка вместо чужих питомцев.
  const guest = await (await fetch(`${BASE}/sos`)).text();
  ok(guest.includes("Кличка, например Рекс"), "гость видит быструю заявку (поле клички)");
  ok(!guest.includes("Тест-Барбос"), "гость НЕ видит питомца юзера A (приватность)");
  ok(!guest.includes("Тест-Рекс"), "гость НЕ видит питомца юзера B (приватность)");

  // 2. Владелец A: только свои питомцы в селекте.
  const pageA = await (
    await fetch(`${BASE}/sos`, { headers: { cookie: a.cookie } })
  ).text();
  ok(pageA.includes("Тест-Барбос"), "владелец A видит своего питомца");
  ok(!pageA.includes("Тест-Рекс"), "владелец A НЕ видит питомца B (приватность)");

  // 3. Гостевой POST /api/sos без petId создаёт розыск (закрепляем).
  const res = await fetch(`${BASE}/api/sos`, {
    method: "POST",
    headers: J,
    body: JSON.stringify({
      petName: "Тест-Потеряша",
      breed: "метис",
      district: "tverskoy",
      radiusKm: 3,
      comment: "гостевая быстрая заявка",
    }),
  });
  const j = await res.json().catch(() => ({}));
  ok(res.status === 201 && Boolean(j.id), `гостевой SOS → 201 + id (${res.status})`);
  if (j.id) {
    cleanup.losts.push(j.id);
    const rep = await db.lostReport.findUnique({ where: { id: j.id } });
    ok(rep?.userId === null && rep?.petId === null, "гостевой розыск без привязок (userId/petId = null)");
    ok(rep?.district === "tverskoy", `район сохранён (${rep?.district})`);
  }
} finally {
  for (const id of cleanup.losts) {
    await db.sighting.deleteMany({ where: { reportId: id } }).catch(() => {});
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  }
  for (const id of cleanup.pets) await db.pet.delete({ where: { id } }).catch(() => {});
  for (const uid of cleanup.users) {
    await db.notification.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.session.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.user.delete({ where: { id: uid } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
