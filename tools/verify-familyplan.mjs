// Сторож семейного плана «Лапка+» (P3 #13): подписка family → план plus +
// Purchase 299 с маркером тарифа (refId="family"); подписка без tier → solo 199
// (обратная совместимость); повтор при активном плане → already без второго
// списания; кривой тариф → 400; тарифная сетка в SSR /plus.
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
const clean = { users: [] };
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
const subscribe = (headers, body) =>
  fetch(`${BASE}/api/plus/subscribe`, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });

try {
  // 1) Семейный тариф → план plus + Purchase 299 (refId=family).
  const fam = await mkUser("Семья");
  const r1 = await subscribe(fam.headers, { tier: "family" });
  ok(r1.ok, "подписка family → 200");
  const famUser = await db.user.findUnique({ where: { id: fam.u.id } });
  ok(famUser.plan === "plus", "план plus активирован");
  const famPurchase = await db.purchase.findFirst({
    where: { userId: fam.u.id, kind: "plus" },
  });
  ok(
    famPurchase?.amountRub === 299 && famPurchase?.refId === "family",
    "Purchase 299 ₽ с маркером family",
  );

  // 2) Повтор при активном плане → already, Purchase один.
  const r2 = await subscribe(fam.headers, { tier: "family" });
  const j2 = await r2.json().catch(() => ({}));
  const cnt = await db.purchase.count({
    where: { userId: fam.u.id, kind: "plus" },
  });
  ok(j2.already === true && cnt === 1, "повтор → already, без второго списания");

  // 3) Без tier → solo 199 (обратная совместимость со старым клиентом).
  const solo = await mkUser("Личный");
  await subscribe(solo.headers);
  const soloPurchase = await db.purchase.findFirst({
    where: { userId: solo.u.id, kind: "plus" },
  });
  ok(
    soloPurchase?.amountRub === 199 && soloPurchase?.refId === "solo",
    "без tier → solo 199 (обратная совместимость)",
  );

  // 4) Кривой тариф → 400 (и план не активирован).
  const bad = await mkUser("Кривой");
  const r4 = await subscribe(bad.headers, { tier: "vip" });
  const badUser = await db.user.findUnique({ where: { id: bad.u.id } });
  ok(r4.status === 400 && badUser.plan !== "plus", "неизвестный тариф → 400");

  // 5) SSR /plus: тарифная сетка с обеими ценами.
  const html = await (await fetch(`${BASE}/plus`)).text();
  ok(
    html.includes("Семейный") && html.includes("299"),
    "/plus: карточка семейного тарифа",
  );
} finally {
  for (const id of clean.users) {
    await db.purchase.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.session.deleteMany({ where: { userId: id } }).catch(() => {});
    await db.user.delete({ where: { id } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
