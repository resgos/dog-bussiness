// Бизнес-фичи: Boost (продвижение SOS), Лапка+ (подписка), B2B-листинги партнёров + реестр Purchase.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
const stamp = Date.now();
const rb = (n) => randomBytes(n).toString("hex");
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const mk = async (name) => {
  const u = await db.user.create({ data: { name, email: `${name}-${stamp}@e.ru`, passwordHash: "x:y", referralCode: rb(5) } });
  const tok = rb(32); await db.session.create({ data: { token: tok, userId: u.id, expiresAt: new Date(Date.now() + 864e5) } });
  return { u, ck: `lapka_session=${tok}` };
};
const ids = [];

console.log("— Boost: платное продвижение объявления —");
const owner = await mk("BizOwner"); const other = await mk("BizOther"); ids.push(owner.u.id, other.u.id);
const rep = await db.lostReport.create({ data: { petName: "Бустик", userId: owner.u.id, status: "active", district: "khamovniki" } });
let r = await fetch(`${BASE}/api/reports/${rep.id}/boost`, { method: "POST", headers: { Cookie: owner.ck } });
ok(r.status === 200, `владелец бустит → ${r.status} (200)`);
const repAfter = await db.lostReport.findUnique({ where: { id: rep.id } });
ok(repAfter?.boostedUntil && new Date(repAfter.boostedUntil) > new Date(), `boostedUntil в будущем (${repAfter?.boostedUntil?.toISOString?.()?.slice(0,10)})`);
ok((await db.purchase.count({ where: { kind: "boost", refId: rep.id, amountRub: 299 } })) === 1, "запись Purchase boost 299₽ создана");
r = await fetch(`${BASE}/api/reports/${rep.id}/boost`, { method: "POST", headers: { Cookie: other.ck } });
ok(r.status === 403, `чужой не может бустить → ${r.status} (403)`);
r = await fetch(`${BASE}/api/reports/${rep.id}/boost`, { method: "POST" });
ok(r.status === 401, `аноним → ${r.status} (401)`);

console.log("\n— Лапка+: подписка —");
r = await fetch(`${BASE}/api/plus/subscribe`, { method: "POST", headers: { Cookie: other.ck } });
ok(r.status === 200, `оформление подписки → ${r.status} (200)`);
const u2 = await db.user.findUnique({ where: { id: other.u.id } });
ok(u2?.plan === "plus" && u2?.planUntil && new Date(u2.planUntil) > new Date(), `plan=plus, planUntil в будущем (${u2?.plan})`);
ok((await db.purchase.count({ where: { userId: other.u.id, kind: "plus", amountRub: 199 } })) === 1, "запись Purchase plus 199₽ создана");
r = await fetch(`${BASE}/api/plus/subscribe`, { method: "POST" });
ok(r.status === 401, `аноним → ${r.status} (401)`);

console.log("\n— B2B: заявка партнёра + модерация + featured —");
const pname = `B2BКлиника-${stamp}`;
r = await fetch(`${BASE}/api/partners`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: pname, type: "vet", district: "tverskoy", contactEmail: "b2b@e.ru", phone: "+700" }) });
ok((r.status === 200 || r.status === 201), `заявка партнёра принята → ${r.status}`);
const pend = await db.partner.findFirst({ where: { name: pname } });
ok(pend?.status === "pending", `заявка со статусом pending (${pend?.status})`);
r = await fetch(`${BASE}/api/partners`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "X", type: "космос" }) });
ok(r.status === 400, `неверный тип → ${r.status} (400)`);
// approved + featured партнёр для витрины
const feat = await db.partner.create({ data: { name: `Промо-Груминг-${stamp}`, type: "groomer", district: "khamovniki", status: "approved", featured: true } });
r = await fetch(`${BASE}/services`);
const svc = await r.text();
ok(r.status === 200 && svc.includes(feat.name), "/services показывает одобренного партнёра");
ok(!svc.includes(pname), "/services НЕ показывает pending-заявку (модерация)");
ok(svc.includes("Рекомендуем") || svc.includes("⭐"), "featured-партнёр помечен бейджем");

console.log("\n— Страницы монетизации —");
for (const [p, needle] of [["/plus", "Лапка+"], ["/partners", "заявк"], ["/partners/new", "сервис"]]) {
  const res = await fetch(`${BASE}${p}`);
  ok(res.status === 200 && (await res.text()).toLowerCase().includes(needle.toLowerCase()), `${p} рендерится (содержит «${needle}»)`);
}

console.log("\n— Реестр выручки —");
const total = await db.purchase.aggregate({ where: { OR: [{ refId: rep.id }, { userId: { in: ids } }] }, _sum: { amountRub: true }, _count: true });
ok(total._count >= 2 && (total._sum.amountRub ?? 0) >= 498, `Purchase: ${total._count} покупок на сумму ${total._sum.amountRub}₽`);

console.log("\n— Уборка —");
await db.purchase.deleteMany({ where: { OR: [{ refId: rep.id }, { userId: { in: ids } }] } });
await db.lostReport.deleteMany({ where: { id: rep.id } });
await db.partner.deleteMany({ where: { name: { in: [pname, feat.name] } } });
await db.session.deleteMany({ where: { userId: { in: ids } } });
await db.user.deleteMany({ where: { id: { in: ids } } });
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
