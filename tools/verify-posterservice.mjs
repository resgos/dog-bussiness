// Сторож «Расклеить за вас» (P1 #7): заказ вошедшим → Purchase 990 ₽; повтор →
// already без второго списания (идемпотентность — критично для реального шлюза);
// гость 401; закрытый розыск 400. SSR плаката: гостю виден мост в /auth, после
// заявки — «Заявка принята» (сервер знает alreadyOrdered).
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
  const user = await db.user.create({
    data: { email: `poster${s}@test.local`, name: `Курьер${s}`, passwordHash: "x" },
  });
  clean.users.push(user.id);
  const token = randomUUID();
  await db.session.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  const cookie = { Cookie: `lapka_session=${token}` };

  const report = await db.lostReport.create({
    data: { petName: `Расклейка${s}`, status: "active", district: "tverskoy" },
  });
  clean.reports.push(report.id);

  // SSR до заявки: гостю — мост в /auth, вошедшему — кнопка (проверяем гостя,
  // анонимный fetch = гость).
  const beforeHtml = await (await fetch(`${BASE}/poster/${report.id}`)).text();
  ok(
    beforeHtml.includes("Войдите, чтобы заказать расклейку"),
    "SSR (гость): мост в /auth вместо кнопки",
  );

  // 1) Заказ вошедшим → Purchase 990.
  const r1 = await fetch(`${BASE}/api/reports/${report.id}/poster-service`, {
    method: "POST",
    headers: cookie,
  });
  ok(r1.ok, "заказ расклейки → 200");
  const p1 = await db.purchase.findMany({
    where: { kind: "poster-service", refId: report.id },
  });
  ok(p1.length === 1 && p1[0].amountRub === 990, "Purchase 990 ₽ записан");

  // 2) Повторный заказ → already, второго списания нет.
  const r2 = await fetch(`${BASE}/api/reports/${report.id}/poster-service`, {
    method: "POST",
    headers: cookie,
  });
  const j2 = await r2.json().catch(() => ({}));
  const p2 = await db.purchase.count({
    where: { kind: "poster-service", refId: report.id },
  });
  ok(r2.ok && j2.already === true && p2 === 1, "повтор → already, Purchase один");

  // 3) SSR после заявки: «Заявка принята» (alreadyOrdered с сервера).
  const afterHtml = await (await fetch(`${BASE}/poster/${report.id}`)).text();
  ok(afterHtml.includes("Заявка принята"), "SSR: «Заявка принята» после заказа");

  // 4) Гейты: гость 401; закрытый розыск 400.
  const guest = await fetch(`${BASE}/api/reports/${report.id}/poster-service`, {
    method: "POST",
  });
  ok(guest.status === 401, "гость → 401");
  const closed = await db.lostReport.create({
    data: { petName: `Закрыт${s}`, status: "found", district: "tverskoy" },
  });
  clean.reports.push(closed.id);
  const closedRes = await fetch(`${BASE}/api/reports/${closed.id}/poster-service`, {
    method: "POST",
    headers: cookie,
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
