// Сторож моста «SOS → буст» (P0 #2 бизнес-беклога): полный флоу деньгами —
// SOS владельца через API (сессия) → POST boost → boostedUntil в будущем →
// бейдж «Продвигается» + запись в Purchase (реестр выручки). Гостевой буст
// отбивается 401 (Purchase пишется на аккаунт). Success-экран статически
// содержит оба варианта моста (клиентский state — по HTTP не виден).
import { readFile } from "node:fs/promises";
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
const clean = { reports: [], users: [] };
try {
  // 0) Владелец + сессия (паттерн verify-photohash).
  const owner = await db.user.create({
    data: {
      email: `boost${s}@test.local`,
      name: `Буст${s}`,
      passwordHash: "x",
    },
  });
  clean.users.push(owner.id);
  const token = randomUUID();
  await db.session.create({
    data: { token, userId: owner.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  const authed = { "Content-Type": "application/json", Cookie: `lapka_session=${token}` };

  // 1) SOS владельца через публичный API.
  const res = await fetch(`${BASE}/api/sos`, {
    method: "POST",
    headers: authed,
    body: JSON.stringify({ petName: `БустМост${s}`, district: "tverskoy", radiusKm: 2 }),
  });
  const j = await res.json().catch(() => ({}));
  ok(res.ok && j.id, "SOS владельца создан через API");
  if (j.id) clean.reports.push(j.id);

  // 2) Буст своего объявления → boostedUntil в будущем.
  const boostRes = await fetch(`${BASE}/api/reports/${j.id}/boost`, {
    method: "POST",
    headers: { Cookie: `lapka_session=${token}` },
  });
  const boost = await boostRes.json().catch(() => ({}));
  ok(boostRes.ok, "POST /boost владельцем → 200 (демо-оплата)");
  ok(
    boost.boostedUntil && new Date(boost.boostedUntil).getTime() > Date.now(),
    "boostedUntil в будущем",
  );

  // 3) Выручка зафиксирована в Purchase.
  const purchase = await db.purchase.findFirst({
    where: { userId: owner.id, kind: "boost", refId: j.id },
  });
  ok(Boolean(purchase && purchase.amountRub === 299), "Purchase 299 ₽ записан");

  // 4) Бейдж продвижения на детальной.
  const html = await (await fetch(`${BASE}/lost/${j.id}`)).text();
  ok(html.includes("Продвигается"), "детальная: бейдж «Продвигается»");

  // 5) Гостевой буст отбивается (гейт монетизации).
  const guestSos = await fetch(`${BASE}/api/sos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ petName: `Гость${s}`, district: "tverskoy", radiusKm: 2 }),
  });
  const g = await guestSos.json().catch(() => ({}));
  if (g.id) clean.reports.push(g.id);
  const guestBoost = await fetch(`${BASE}/api/reports/${g.id}/boost`, {
    method: "POST",
  });
  ok(guestBoost.status === 401, "гостевой буст → 401 (гейт)");

  // 6) Статическая регрессия success-экрана: мост в обоих вариантах.
  const src = await readFile("src/components/sos/SosForm.tsx", "utf8");
  ok(
    src.includes("Ускорить поиск") &&
      src.includes("<BoostButton") &&
      src.includes("Войдите, чтобы поднять в топ"),
    "success-экран: BoostButton владельцу + мост в /auth гостю",
  );
} finally {
  for (const id of clean.reports)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  for (const id of clean.users) {
    await db.purchase.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.session.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.user.delete({ where: { id } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
