// Сторож «Моих покупок» (/profile/purchases): история оплат аккаунта — лейблы
// каналов, суммы, итог (data-purchases-total), ссылка на связанный розыск;
// чужие покупки не видны; гостю — карточка входа.
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
const clean = { users: [], reports: [], purchases: [] };
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

try {
  const { u: buyer, cookie } = await mkUser("Покупатель");
  const { u: other } = await mkUser("Чужой");

  const report = await db.lostReport.create({
    data: { petName: `Покупки${s}`, status: "active", district: "tverskoy" },
  });
  clean.reports.push(report.id);

  for (const [userId, kind, amountRub] of [
    [buyer.id, "boost", 299],
    [buyer.id, "reward-donation", 300],
    [other.id, "poster-service", 990],
  ]) {
    const p = await db.purchase.create({
      data: { userId, kind, amountRub, refId: report.id },
    });
    clean.purchases.push(p.id);
  }

  // Гость → карточка входа.
  const guest = await (await fetch(`${BASE}/profile/purchases`)).text();
  ok(guest.includes("Войдите, чтобы видеть покупки"), "гость: карточка входа");

  // Покупатель видит свои покупки, итог и ссылку на розыск; чужую — нет.
  const html = await (
    await fetch(`${BASE}/profile/purchases`, { headers: cookie })
  ).text();
  ok(
    html.includes("Продвижение объявлений") && html.includes("Донат на награду"),
    "лейблы каналов из единого словаря",
  );
  ok(html.includes('data-purchases-total="599"'), "итог 599 ₽ (299+300)");
  ok(html.includes(`/lost/${report.id}`), "ссылка «открыть объявление»");
  ok(!html.includes("Расклейка плакатов"), "чужая покупка не видна");
} finally {
  for (const id of clean.purchases)
    await db.purchase.delete({ where: { id } }).catch(() => {});
  for (const id of clean.reports)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  for (const id of clean.users) {
    await db.session.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.user.delete({ where: { id } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
