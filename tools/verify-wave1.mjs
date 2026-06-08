// Волна 1: idempotency кредита, size/color в SOS, подписка на находки, алерт совпадений, тизер главной.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
const stamp = Date.now();
const rb = (n) => randomBytes(n).toString("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const mk = async (name) => {
  const u = await db.user.create({ data: { name, email: `${name}-${stamp}@e.ru`, passwordHash: "x:y", referralCode: rb(5), helpedCount: 0, district: "khamovniki" } });
  const tok = rb(32); await db.session.create({ data: { token: tok, userId: u.id, expiresAt: new Date(Date.now() + 864e5) } });
  return { u, ck: `lapka_session=${tok}` };
};
const cleanupIds = [];

console.log("— Idempotency кредита «кто помог» (reopen не даёт двойной кредит) —");
const owner = await mk("Влад"); const helper = await mk("Помогаша");
cleanupIds.push(owner.u.id, helper.u.id);
const rep = await db.lostReport.create({ data: { petName: "Тузик", userId: owner.u.id, status: "active", district: "khamovniki" } });
await fetch(`${BASE}/api/sightings`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: helper.ck }, body: JSON.stringify({ reportId: rep.id, lat: 55.7, lng: 37.6, comment: "тут" }) });
const patch = (status) => fetch(`${BASE}/api/reports/${rep.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: owner.ck }, body: JSON.stringify({ status }) });
await patch("found"); await sleep(300);
let hc = (await db.user.findUnique({ where: { id: helper.u.id } })).helpedCount;
ok(hc === 1, `после первого found helpedCount=1 (got ${hc})`);
const repRow = await db.lostReport.findUnique({ where: { id: rep.id } });
ok(Boolean(repRow.helpersCreditedAt), "helpersCreditedAt проставлен");
await patch("home"); await sleep(150); await patch("found"); await sleep(300);
hc = (await db.user.findUnique({ where: { id: helper.u.id } })).helpedCount;
ok(hc === 1, `после reopen→found повторного кредита НЕТ (helpedCount=${hc})`);

console.log("\n— size/color в SOS (из карточки питомца) —");
const sosOwner = await mk("Хозяйка"); cleanupIds.push(sosOwner.u.id);
const pet = await db.pet.create({ data: { name: "Рыжик", userId: sosOwner.u.id, status: "home", size: "medium", color: "рыжий с белой грудкой" } });
const sres = await fetch(`${BASE}/api/sos`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: sosOwner.ck }, body: JSON.stringify({ petId: pet.id, petName: "Рыжик", breed: "метис", district: "khamovniki", radiusKm: 3 }) });
const sj = await sres.json();
const sosReport = await db.lostReport.findUnique({ where: { id: sj.id } });
ok(sres.status === 201 && sosReport?.size === "medium" && sosReport?.color === "рыжий с белой грудкой", `SOS подтянул size/color (${sosReport?.size}/${sosReport?.color})`);
await db.lostReport.deleteMany({ where: { id: sj.id } });
await db.pet.deleteMany({ where: { id: pet.id } });

console.log("\n— Подписка на находки (toggle/доступ) —");
const sub = await mk("Подписчик"); cleanupIds.push(sub.u.id);
const found = await db.foundReport.create({ data: { finderName: "Нашёл", contactPhone: "+70000000000", breed: "корги", district: "khamovniki", status: "open" } });
let r = await fetch(`${BASE}/api/found/${found.id}/subscribe`, { method: "POST", headers: { Cookie: sub.ck } });
ok(r.status === 200 && (await r.json()).following === true, "U подписался на находку → following:true");
r = await fetch(`${BASE}/api/found/${found.id}/subscribe`, { method: "POST", headers: { Cookie: sub.ck } });
ok((await r.json()).following === false, "повторно → отписка");
r = await fetch(`${BASE}/api/found/${found.id}/subscribe`, { method: "POST" });
ok(r.status === 401, `аноним → ${r.status} (401)`);
r = await fetch(`${BASE}/api/found/нет/subscribe`, { method: "POST", headers: { Cookie: sub.ck } });
ok(r.status === 404, `несуществующая находка → ${r.status} (404)`);

console.log("\n— Умный алерт совпадений при создании находки —");
const matchOwner = await mk("Ждёт"); cleanupIds.push(matchOwner.u.id);
const lost = await db.lostReport.create({ data: { petName: "Барон", userId: matchOwner.u.id, status: "active", district: "khamovniki", breed: "лабрадор", color: "чёрный", size: "large" } });
const fr = await fetch(`${BASE}/api/found`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ finderName: "Сосед", contactPhone: "+70000000001", breed: "лабрадор", color: "чёрный", size: "large", district: "khamovniki" }) });
const frj = await fr.json();
await sleep(500);
ok(fr.status === 201 && (await db.notification.count({ where: { userId: matchOwner.u.id, title: { contains: "нашлась твоя" } } })) > 0, "владелец похожей пропажи получил алерт совпадения");
const dupAlerts = await db.notification.count({ where: { userId: matchOwner.u.id, type: "found" } });
ok(dupAlerts === 1, `алерт ровно один (дедуп старого блока) → ${dupAlerts}`);
await db.foundReport.deleteMany({ where: { id: frj.id } });
await db.lostReport.deleteMany({ where: { id: lost.id } });
await db.foundReport.deleteMany({ where: { id: found.id } });
await db.lostReport.deleteMany({ where: { id: rep.id } });

console.log("\n— Тизер историй на главной + ленты —");
const teaserU = await mk("Рассказчик"); cleanupIds.push(teaserU.u.id);
const reu = await db.reunion.create({ data: { petName: "Найда", story: "Вернулась через сутки! Спасибо стае 💛", district: "khamovniki", userId: teaserU.u.id } });
r = await fetch(`${BASE}/`);
const home = await r.text();
ok(r.status === 200 && (home.includes("вернул") || home.includes("истори")), "главная показывает тизер историй (count>0)");
await db.reunion.deleteMany({ where: { id: reu.id } });
for (const [p, needle] of [["/feed/lost", "Активные"], ["/feed/found", "Наход"]]) {
  const res = await fetch(`${BASE}${p}`);
  ok(res.status === 200 && (await res.text()).includes(needle), `${p} рендерится (фильтры)`);
}

console.log("\n— Уборка —");
await db.notification.deleteMany({ where: { userId: { in: cleanupIds } } });
await db.sighting.deleteMany({ where: { reportId: rep.id } });
await db.foundEvent.deleteMany({ where: { petName: { in: ["Тузик", "Барон"] } } });
await db.session.deleteMany({ where: { userId: { in: cleanupIds } } });
await db.reunion.deleteMany({ where: { userId: { in: cleanupIds } } });
await db.user.deleteMany({ where: { id: { in: cleanupIds } } });
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
