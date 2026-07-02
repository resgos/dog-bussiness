// Сторож «Награды от соседей» (P1 #4): полный флоу деньгами — донат вошедшего
// соседа → Purchase (kind=reward-donation) → агрегация пула на детальной;
// гейты: гость 401, закрытый розыск 400, кривая сумма 400. UI-блок и мост в
// /auth фиксируются в SSR детальной (сервер знает isAuthed/active).
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
  // Сосед с сессией (паттерн verify-boostbridge).
  const donor = await db.user.create({
    data: { email: `donor${s}@test.local`, name: `Сосед${s}`, passwordHash: "x" },
  });
  clean.users.push(donor.id);
  const token = randomUUID();
  await db.session.create({
    data: { token, userId: donor.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  const authed = { "Content-Type": "application/json", Cookie: `lapka_session=${token}` };

  // Активный розыск.
  const report = await db.lostReport.create({
    data: { petName: `Копилка${s}`, status: "active", district: "tverskoy" },
  });
  clean.reports.push(report.id);

  // 1) Донат 300 + донат 100 → пул 400 (агрегация).
  const d1 = await fetch(`${BASE}/api/reports/${report.id}/donate`, {
    method: "POST",
    headers: authed,
    body: JSON.stringify({ amountRub: 300 }),
  });
  const j1 = await d1.json().catch(() => ({}));
  ok(d1.ok && j1.total === 300, "донат 300 ₽ → пул 300");
  const d2 = await fetch(`${BASE}/api/reports/${report.id}/donate`, {
    method: "POST",
    headers: authed,
    body: JSON.stringify({ amountRub: 100 }),
  });
  const j2 = await d2.json().catch(() => ({}));
  ok(d2.ok && j2.total === 400, "донат 100 ₽ → пул агрегируется до 400");

  // 2) Purchase-записи в реестре выручки.
  const rows = await db.purchase.findMany({
    where: { kind: "reward-donation", refId: report.id },
  });
  ok(
    rows.length === 2 && rows.reduce((a, r) => a + r.amountRub, 0) === 400,
    "Purchase: 2 записи на 400 ₽",
  );

  // 3) Детальная показывает пул (SSR).
  const html = await (await fetch(`${BASE}/lost/${report.id}`)).text();
  ok(
    html.includes("Награда от соседей") && html.includes("400"),
    "детальная: «Награда от соседей: 400 ₽»",
  );
  ok(
    html.includes("Войдите, чтобы добавить к награде"),
    "детальная (гость): мост в /auth вместо кнопок",
  );

  // 4) Гейты: гость 401; кривая сумма 400; закрытый розыск 400.
  const guest = await fetch(`${BASE}/api/reports/${report.id}/donate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountRub: 300 }),
  });
  ok(guest.status === 401, "гость → 401");
  const badAmount = await fetch(`${BASE}/api/reports/${report.id}/donate`, {
    method: "POST",
    headers: authed,
    body: JSON.stringify({ amountRub: 999999 }),
  });
  ok(badAmount.status === 400, "сумма вне белого списка → 400");
  const closed = await db.lostReport.create({
    data: { petName: `Закрыт${s}`, status: "found", district: "tverskoy" },
  });
  clean.reports.push(closed.id);
  const closedRes = await fetch(`${BASE}/api/reports/${closed.id}/donate`, {
    method: "POST",
    headers: authed,
    body: JSON.stringify({ amountRub: 100 }),
  });
  ok(closedRes.status === 400, "закрытый розыск → 400");
} finally {
  for (const id of clean.reports) {
    await db.purchase.deleteMany({ where: { refId: id } }).catch(() => {});
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  }
  for (const id of clean.users) {
    await db.session.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.user.delete({ where: { id } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
