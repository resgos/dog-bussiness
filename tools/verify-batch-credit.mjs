// Проверка батча: «кто помог» (авто-кредит), истории воссоединения, профиль волонтёра.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
const stamp = Date.now();
const rb = (n) => randomBytes(n).toString("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

// — окружение —
const mk = async (name) => {
  const u = await db.user.create({ data: { name, email: `${name}-${stamp}@e.ru`, passwordHash: "x:y", referralCode: rb(5), helpedCount: 0 } });
  const tok = rb(32);
  await db.session.create({ data: { token: tok, userId: u.id, expiresAt: new Date(Date.now() + 864e5) } });
  return { u, ck: `lapka_session=${tok}` };
};
const owner = await mk("Хозяин");
const h1 = await mk("Помощник1");
const h2 = await mk("Помощник2");
const report = await db.lostReport.create({ data: { petName: "Найда", userId: owner.u.id, status: "active", district: "khamovniki" } });
const sight = (ck) => fetch(`${BASE}/api/sightings`, { method: "POST", headers: { "Content-Type": "application/json", ...(ck ? { Cookie: ck } : {}) }, body: JSON.stringify({ reportId: report.id, lat: 55.7, lng: 37.6, comment: "видел" }) });

console.log("— «Кто помог»: привязка наблюдений + авто-кредит при found —");
await sight(h1.ck);                 // h1
await sight(h2.ck);                 // h2
await sight(h1.ck);                 // h1 второй раз (дедуп)
await sight(null);                  // аноним (userId null)
await sight(owner.ck);              // владелец (исключается из кредита)
await sleep(300);
const sCount = await db.sighting.count({ where: { reportId: report.id } });
const attributed = await db.sighting.count({ where: { reportId: report.id, userId: { not: null } } });
ok(sCount === 5 && attributed === 4, `5 наблюдений, 4 привязаны к юзерам (got ${sCount}/${attributed})`);

// закрываем розыск как «найдена» от владельца
const pr = await fetch(`${BASE}/api/reports/${report.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: owner.ck }, body: JSON.stringify({ status: "found" }) });
ok(pr.status === 200, `PATCH found → ${pr.status} (200)`);
await sleep(500);
const h1c = (await db.user.findUnique({ where: { id: h1.u.id } })).helpedCount;
const h2c = (await db.user.findUnique({ where: { id: h2.u.id } })).helpedCount;
const ownc = (await db.user.findUnique({ where: { id: owner.u.id } })).helpedCount;
ok(h1c === 1, `Помощник1 +1 (дедуп двух наблюдений) → helpedCount=${h1c}`);
ok(h2c === 1, `Помощник2 +1 → helpedCount=${h2c}`);
ok(ownc === 0, `владелец НЕ кредитован → helpedCount=${ownc}`);
ok((await db.notification.count({ where: { userId: h1.u.id, title: { contains: "Спасибо" } } })) > 0, "помощнику пришла благодарность");

console.log("\n— Истории воссоединения —");
let r = await fetch(`${BASE}/api/reunions`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: owner.ck }, body: JSON.stringify({ petName: "Найда", story: "Нашлась через 2 часа благодаря соседям! Спасибо стае 💛", district: "khamovniki", reportId: report.id }) });
const rj = await r.json();
ok(r.status === 200 && rj.ok, `POST истории владельцем → ${r.status}`);
ok(Boolean(await db.reunion.findFirst({ where: { userId: owner.u.id, petName: "Найда" } })), "история сохранена с userId");
r = await fetch(`${BASE}/api/reunions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ petName: "X", story: "y" }) });
ok(r.status === 401, `аноним POST → ${r.status} (401)`);
r = await fetch(`${BASE}/api/reunions`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: owner.ck }, body: JSON.stringify({ petName: "", story: "" }) });
ok(r.status === 400, `пустые поля → ${r.status} (400)`);
r = await fetch(`${BASE}/reunited`);
const rhtml = await r.text();
ok(r.status === 200 && rhtml.includes("Найда") && rhtml.includes("вернул"), "/reunited показывает историю");
r = await fetch(`${BASE}/reunited/new`, { headers: { Cookie: owner.ck } });
ok((await r.text()).includes("стори") || (await (await fetch(`${BASE}/reunited/new`, { headers: { Cookie: owner.ck } })).text()).includes("Расскаж"), "/reunited/new показывает форму залогиненному");

console.log("\n— Публичный профиль волонтёра —");
r = await fetch(`${BASE}/community/volunteers/${h1.u.id}`);
const phtml = await r.text();
ok(r.status === 200 && phtml.includes("Помощник1"), `профиль волонтёра → ${r.status}, имя на месте`);
ok(phtml.includes("Первый хвост"), "показано достижение «Первый хвост» (helped=1)");
ok(phtml.includes("помог найти") || phtml.includes("Найти") || phtml.includes("найти"), "блок вклада присутствует");
r = await fetch(`${BASE}/community/volunteers/нет-такого-id`);
ok(r.status === 404, `несуществующий волонтёр → ${r.status} (404)`);
r = await fetch(`${BASE}/community/volunteers`);
ok((await r.text()).includes("/community/volunteers/"), "в рейтинге имена-ссылки на профиль");

// — уборка —
console.log("\n— Уборка —");
const ids = [owner.u.id, h1.u.id, h2.u.id];
await db.reunion.deleteMany({ where: { userId: { in: ids } } });
await db.notification.deleteMany({ where: { userId: { in: ids } } });
await db.sighting.deleteMany({ where: { reportId: report.id } });
await db.foundEvent.deleteMany({ where: { petName: "Найда" } });
await db.lostReport.deleteMany({ where: { id: report.id } });
await db.session.deleteMany({ where: { userId: { in: ids } } });
await db.user.deleteMany({ where: { id: { in: ids } } });
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
