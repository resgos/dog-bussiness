// Сторож критичных фиксов из код-ревью системы:
// #1 GET /api/pets — авторизация + скоуп (был слив PII всех владельцев);
// #2 subscribe — tier через hasOwnProperty (был обход prototype-ключами);
// #4 boost/subscribe — атомарный CAS (двойной клик/гонка не списывает дважды).
// Гонку проверяем реально — двумя параллельными Promise.all-запросами.
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

const s = Date.now();
const clean = { users: [], pets: [], reports: [] };
const mkUser = async (tag) => {
  const u = await db.user.create({
    data: { email: `${tag}${s}@test.local`, name: `${tag}${s}`, passwordHash: "x" },
  });
  clean.users.push(u.id);
  const token = randomUUID();
  await db.session.create({
    data: { token, userId: u.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  return { u, cookie: { Cookie: `lapka_session=${token}` } };
};
const jpost = (path, cookie, body) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie || {}) },
    body: JSON.stringify(body ?? {}),
  });

try {
  // ── #1 Утечка PII через GET /api/pets ──
  const PHONE = `+7999${s.toString().slice(-7)}`;
  const owner = await mkUser("Хозяин");
  const pet = await db.pet.create({
    data: { name: `Пёс${s}`, userId: owner.u.id, ownerPhone: PHONE, showPhone: false },
  });
  clean.pets.push(pet.id);

  const anon = await fetch(`${BASE}/api/pets`);
  const anonBody = await anon.text();
  ok(anon.status === 401, "GET /api/pets без входа → 401");
  ok(!anonBody.includes(PHONE), "телефон владельца не утёк анониму");

  const other = await mkUser("Чужой");
  const otherBody = await (
    await fetch(`${BASE}/api/pets`, { headers: other.cookie })
  ).text();
  ok(!otherBody.includes(PHONE), "чужой телефон не виден другому юзеру (скоуп)");

  // ── #2 Обход тарифа prototype-ключами ──
  const proto = await mkUser("Прото");
  for (const bad of ["__proto__", "toString", "constructor"]) {
    const r = await jpost("/api/plus/subscribe", proto.cookie, { tier: bad });
    ok(r.status === 400, `subscribe tier="${bad}" → 400`);
  }
  const protoUser = await db.user.findUnique({ where: { id: proto.u.id } });
  ok(protoUser.plan !== "plus", "prototype-обход не активировал план");
  const protoPurchases = await db.purchase.count({ where: { userId: proto.u.id } });
  ok(protoPurchases === 0, "prototype-обход не создал Purchase");

  // ── #4 Гонка двойного списания: буст (2 параллельных запроса) ──
  const boostReport = await db.lostReport.create({
    data: { petName: `Буст${s}`, status: "active", district: "tverskoy", userId: owner.u.id },
  });
  clean.reports.push(boostReport.id);
  await Promise.all([
    jpost(`/api/reports/${boostReport.id}/boost`, owner.cookie),
    jpost(`/api/reports/${boostReport.id}/boost`, owner.cookie),
  ]);
  const boostCount = await db.purchase.count({
    where: { kind: "boost", refId: boostReport.id },
  });
  ok(boostCount === 1, `гонка буста → ровно 1 Purchase (факт ${boostCount})`);

  // ── #4 Гонка двойного списания: подписка (2 параллельных запроса) ──
  const sub = await mkUser("Подписка");
  await Promise.all([
    jpost("/api/plus/subscribe", sub.cookie, { tier: "solo" }),
    jpost("/api/plus/subscribe", sub.cookie, { tier: "solo" }),
  ]);
  const subCount = await db.purchase.count({
    where: { kind: "plus", userId: sub.u.id },
  });
  ok(subCount === 1, `гонка подписки → ровно 1 Purchase (факт ${subCount})`);
} finally {
  for (const id of clean.reports) {
    await db.purchase.deleteMany({ where: { refId: id } }).catch(() => {});
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  }
  for (const id of clean.pets) await db.pet.delete({ where: { id } }).catch(() => {});
  for (const id of clean.users) {
    await db.purchase.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.session.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.user.delete({ where: { id } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
