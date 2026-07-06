// Сторож жизненного цикла «Нашлась!» (код-ревью #6): разовые побочки —
// foundEvent + кредит helpedCount — захватываются АТОМАРНО в одной транзакции
// по CAS helpersCreditedAt. Инвариант (совместно с verify-foundrace): помощник
// кредитуется РОВНО раз за жизнь розыска, foundEvent создаётся ровно раз, и то и
// другое согласованно (транзакция — всё-или-ничего). Повторный кредит НОВЫХ
// помощников из окна переоткрытия требует пер-помощник трекинга (миграция,
// supervised) — здесь НЕ сбрасываем флаг, чтобы не задваивать старых.
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

let seq = 0;
const mkUser = async (tag) => {
  const u = await db.user.create({
    data: { email: `flc-${tag}-${Date.now()}-${seq++}@t.local`, name: tag, passwordHash: "x" },
  });
  const token = randomUUID();
  await db.session.create({
    data: { token, userId: u.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  return { id: u.id, cookie: `lapka_session=${token}` };
};
const patch = (rid, cookie, status) =>
  fetch(`${BASE}/api/reports/${rid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status }),
  });
const helped = async (uid) =>
  (await db.user.findUnique({ where: { id: uid } })).helpedCount;

const s = Date.now();
const clean = { users: [], reports: [] };
try {
  const owner = await mkUser("Влад");
  const helper = await mkUser("Помощник");
  const actor = await mkUser("Актор");
  clean.users.push(owner.id, helper.id, actor.id);

  const report = await db.lostReport.create({
    data: { petName: `Жизн${s}`, status: "active", district: "tverskoy", userId: owner.id },
  });
  clean.reports.push(report.id);
  await db.sighting.create({
    data: { reportId: report.id, userId: helper.id, lat: 55.7, lng: 37.6 },
  });

  const h0 = await helped(helper.id);

  const r1 = await patch(report.id, actor.cookie, "found");
  ok(r1.ok, "«Нашлась!» отмечает любой участник (community)");
  ok((await helped(helper.id)) === h0 + 1, "первая находка: помощник +1 к helpedCount");
  ok(
    (await db.foundEvent.count({ where: { petName: `Жизн${s}` } })) === 1,
    "первая находка: ровно один foundEvent (транзакция)",
  );

  await patch(report.id, actor.cookie, "found");
  ok((await helped(helper.id)) === h0 + 1, "повторная «Нашлась!» — без двойного кредита (CAS)");

  // Переоткрытие владельцем + повторная находка: кредит НЕ задваивается
  // (helpersCreditedAt не сбрасывается — раз за жизнь розыска).
  ok((await patch(report.id, owner.cookie, "active")).ok, "переоткрытие (active) — владельцем");
  await patch(report.id, actor.cookie, "found");
  ok((await helped(helper.id)) === h0 + 1, "reopen→refound не задваивает кредит помощника");
  ok(
    (await db.foundEvent.count({ where: { petName: `Жизн${s}` } })) === 1,
    "reopen→refound не плодит второй foundEvent",
  );

  // Чужой не может переоткрыть чужой розыск.
  const stranger = await mkUser("Чужой");
  clean.users.push(stranger.id);
  ok(
    (await patch(report.id, stranger.cookie, "active")).status === 403,
    "переоткрытие чужого розыска → 403",
  );
} finally {
  for (const id of clean.reports) {
    await db.sighting.deleteMany({ where: { reportId: id } }).catch(() => {});
    await db.foundEvent.deleteMany({ where: { petName: `Жизн${s}` } }).catch(() => {});
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
