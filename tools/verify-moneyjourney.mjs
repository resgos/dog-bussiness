// Сквозное путешествие деньгами (интеграция всех каналов монетизации):
// владелец теряет собаку → SOS → буст 299 → заказ расклейки 990 → подписка
// family 299; сосед донатит 300. Проверяем стыки, которые не видят по-фичевые
// сторожа: «Мои покупки» владельца собирают ВСЁ его (1588, без чужого доната),
// /pulse-дельты считают выручку (1588) и донаты (300) раздельно, детальная
// показывает бейдж буста и пул соседей одновременно.
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

const readPulse = async () => {
  const html = await (await fetch(`${BASE}/pulse`)).text();
  return {
    rev: Number((html.match(/data-revenue-total="(\d+)"/) || [])[1] ?? 0),
    don: Number((html.match(/data-donated-total="(\d+)"/) || [])[1] ?? 0),
  };
};

const s = Date.now();
const clean = { users: [], reports: [] };
const mkUser = async (tag) => {
  const u = await db.user.create({
    data: { email: `${tag}${s}@test.local`, name: `${tag}${s}`, passwordHash: "x" },
  });
  clean.users.push(u.id);
  const token = randomUUID();
  await db.session.create({
    data: { token, userId: u.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  return {
    u,
    headers: { "Content-Type": "application/json", Cookie: `lapka_session=${token}` },
  };
};
const post = (path, headers, body) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

try {
  const before = await readPulse();
  const owner = await mkUser("Владелец");
  const neighbor = await mkUser("Сосед");

  // 1) SOS владельца.
  const sos = await post("/api/sos", owner.headers, {
    petName: `Джорни${s}`,
    district: "tverskoy",
    radiusKm: 2,
  });
  const report = await sos.json().catch(() => ({}));
  ok(sos.ok && report.id, "SOS создан");
  if (report.id) clean.reports.push(report.id);

  // 2) Путешествие деньгами: буст → расклейка → подписка family; сосед донатит.
  ok((await post(`/api/reports/${report.id}/boost`, owner.headers)).ok, "буст 299 ₽");
  ok(
    (await post(`/api/reports/${report.id}/poster-service`, owner.headers)).ok,
    "расклейка 990 ₽",
  );
  ok(
    (await post("/api/plus/subscribe", owner.headers, { tier: "family" })).ok,
    "подписка family 299 ₽",
  );
  ok(
    (await post(`/api/reports/${report.id}/donate`, neighbor.headers, { amountRub: 300 })).ok,
    "донат соседа 300 ₽",
  );

  // 3) Детальная: бейдж буста и пул соседей живут вместе.
  const detail = await (await fetch(`${BASE}/lost/${report.id}`)).text();
  ok(
    detail.includes("Продвигается") && detail.includes("Награда от соседей"),
    "детальная: буст + пул соседей одновременно",
  );

  // 4) «Мои покупки» владельца: всё его (299+990+299=1588) и ничего чужого.
  const purchases = await (
    await fetch(`${BASE}/profile/purchases`, { headers: owner.headers })
  ).text();
  ok(
    purchases.includes('data-purchases-total="1588"'),
    "«Мои покупки» владельца: итог 1588 ₽",
  );
  ok(!purchases.includes("Донат на награду"), "чужой донат не в покупках владельца");

  // 5) /pulse: выручка и донаты разнесены точными дельтами.
  const after = await readPulse();
  ok(
    after.rev - before.rev === 1588,
    `pulse: дельта выручки 1588, факт ${after.rev - before.rev}`,
  );
  ok(
    after.don - before.don === 300,
    `pulse: дельта донатов 300, факт ${after.don - before.don}`,
  );
} finally {
  for (const id of clean.reports) {
    await db.purchase.deleteMany({ where: { refId: id } }).catch(() => {});
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  }
  for (const id of clean.users) {
    await db.purchase.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.session.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.user.delete({ where: { id } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
