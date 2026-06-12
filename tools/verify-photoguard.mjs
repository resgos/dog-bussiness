// Сторож валидации загрузки фото: роуты создания (sos/found/pets) должны
// отклонять не-image и гигантские data URL (savePhoto размер НЕ проверяет →
// иначе DB-блоат/DoS). Раньше гард был только в adoption/sightings/reunions.
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
const mkSession = async (name) => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({
    data: { name, email: `pg+${name}-${Date.now()}@lapka.test` },
  });
  await db.session.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  cleanup.users.push(user.id);
  return `lapka_session=${token}`;
};

// > 3 МБ «data:image» — должно отклоняться по размеру.
const huge = "data:image/png;base64," + "A".repeat(3_000_001);
// 1×1 px PNG — валидное маленькое фото, отклоняться НЕ должно.
const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const post = (path, body, cookie) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: cookie ? { ...J, cookie } : J,
    body: JSON.stringify(body),
  });

try {
  // 1. SOS: не-image → 400.
  ok(
    (await post("/api/sos", { petName: "ФотоГард", photo: "javascript:alert(1)" })).status === 400,
    "SOS: не-image фото → 400",
  );

  // 2. FOUND: не-image → 400.
  ok(
    (await post("/api/found", { breed: "ГардX", photo: "notanimage" })).status === 400,
    "FOUND: не-image фото → 400",
  );

  // 3. FOUND: data:image больше лимита → 400.
  ok(
    (await post("/api/found", { breed: "ГардY", photo: huge })).status === 400,
    "FOUND: data:image > 3 МБ → 400",
  );

  const cookie = await mkSession("PGuard");

  // 4. PETS: не-image (с сессией) → 400.
  ok(
    (await post("/api/pets", { name: "ФотоГардПёс", photo: "notanimage" }, cookie)).status === 400,
    "PETS: не-image фото → 400",
  );

  // 5. Позитив: валидное маленькое фото не ломает создание (pets, без сайд-эффектов).
  const okRes = await post("/api/pets", { name: "ФотоГардОК", photo: tinyPng }, cookie);
  const okJson = await okRes.json().catch(() => ({}));
  ok(okRes.status === 201 && Boolean(okJson.id), `PETS: валидное data:image → 201 (${okRes.status})`);
  if (okJson.id) cleanup.pets.push(okJson.id);
} finally {
  for (const id of cleanup.losts)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.pets)
    await db.pet.delete({ where: { id } }).catch(() => {});
  for (const uid of cleanup.users) {
    await db.session.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.user.delete({ where: { id: uid } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
