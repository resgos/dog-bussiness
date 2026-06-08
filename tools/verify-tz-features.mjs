// Проверка ТЗ-фич: достижения (4.2), подписка на объявление (4.5), мультифото (4.2).
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
const stamp = Date.now();
const rb = (n) => randomBytes(n).toString("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IMG = "data:image/jpeg;base64," + "A".repeat(200);
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

// — окружение —
const U = await db.user.create({ data: { name: "Owner", email: `own-${stamp}@e.ru`, passwordHash: "x:y", district: "khamovniki", referralCode: rb(5), helpedCount: 5 } });
const U2 = await db.user.create({ data: { name: "Sub", email: `sub-${stamp}@e.ru`, passwordHash: "x:y", referralCode: rb(5) } });
const ckU = `lapka_session=${rb(32)}`, ckU2 = `lapka_session=${rb(32)}`;
await db.session.create({ data: { token: ckU.split("=")[1], userId: U.id, expiresAt: new Date(Date.now() + 864e5) } });
await db.session.create({ data: { token: ckU2.split("=")[1], userId: U2.id, expiresAt: new Date(Date.now() + 864e5) } });
const pet = await db.pet.create({ data: { name: "Гайка", userId: U.id, status: "home", photo: IMG, breed: "корги", district: "khamovniki", marksText: "белая грудка" } });
const jget = (r) => r.json();

console.log("— Мультифото (ТЗ 4.2): добавление/лимит/удаление/доступ —");
for (let i = 0; i < 3; i++) {
  const r = await fetch(`${BASE}/api/pets/${pet.id}/photos`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: ckU }, body: JSON.stringify({ url: IMG }) });
  if (i === 0) ok(r.status === 200, `POST фото владельцем → ${r.status} (ожидаем 200)`);
}
ok((await db.petPhoto.count({ where: { petId: pet.id } })) === 3, "в БД 3 доп. фото");
let r = await fetch(`${BASE}/api/pets/${pet.id}/photos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: IMG }) });
ok(r.status === 401, `аноним POST → ${r.status} (401)`);
r = await fetch(`${BASE}/api/pets/${pet.id}/photos`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: ckU2 }, body: JSON.stringify({ url: IMG }) });
ok(r.status === 404, `чужой POST → ${r.status} (404)`);
// добиваем до 10 напрямую и проверяем лимит
await db.petPhoto.createMany({ data: Array.from({ length: 7 }, (_, i) => ({ petId: pet.id, url: IMG, order: 3 + i })) });
r = await fetch(`${BASE}/api/pets/${pet.id}/photos`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: ckU }, body: JSON.stringify({ url: IMG }) });
ok(r.status === 400, `11-е фото при лимите 10 → ${r.status} (400)`);
const somePhoto = await db.petPhoto.findFirst({ where: { petId: pet.id } });
r = await fetch(`${BASE}/api/pets/${pet.id}/photos`, { method: "DELETE", headers: { "Content-Type": "application/json", Cookie: ckU }, body: JSON.stringify({ photoId: somePhoto.id }) });
ok(r.status === 200 && (await db.petPhoto.count({ where: { petId: pet.id } })) === 9, `DELETE фото владельцем → ${r.status}, осталось 9`);

console.log("\n— Подписка на объявление (ТЗ 4.5): toggle/доступ/уведомления —");
const report = await db.lostReport.create({ data: { petName: "Рекс", userId: U.id, status: "active", district: "khamovniki" } });
r = await fetch(`${BASE}/api/reports/${report.id}/subscribe`, { method: "POST", headers: { Cookie: ckU2 } });
ok(r.status === 200 && (await jget(r)).following === true, "U2 подписался → following:true");
r = await fetch(`${BASE}/api/reports/${report.id}/subscribe`, { method: "POST", headers: { Cookie: ckU2 } });
ok((await jget(r)).following === false, "повторный POST → отписка following:false");
r = await fetch(`${BASE}/api/reports/${report.id}/subscribe`, { method: "POST", headers: { Cookie: ckU2 } });
ok((await jget(r)).following === true, "третий POST → снова подписан");
r = await fetch(`${BASE}/api/reports/${report.id}/subscribe`, { method: "POST" });
ok(r.status === 401, `аноним → ${r.status} (401)`);
r = await fetch(`${BASE}/api/reports/нет-такого/subscribe`, { method: "POST", headers: { Cookie: ckU2 } });
ok(r.status === 404, `несуществующее объявление → ${r.status} (404)`);
// уведомление о наблюдении
await fetch(`${BASE}/api/sightings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId: report.id, lat: 55.7, lng: 37.6, comment: "видел у метро" }) });
await sleep(400);
ok((await db.notification.count({ where: { userId: U2.id, title: { contains: "наблюдение" } } })) > 0, "подписчик получил уведомление о наблюдении");
// уведомление о смене статуса
await fetch(`${BASE}/api/reports/${report.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: ckU }, body: JSON.stringify({ status: "found" }) });
await sleep(400);
ok((await db.notification.count({ where: { userId: U2.id, title: { contains: "Нашлась" } } })) > 0, "подписчик получил уведомление о смене статуса (Нашлась)");

console.log("\n— Достижения (ТЗ 4.2): расчёт из БД + рендер —");
const post = await db.post.create({ data: { authorId: U.id, text: "пост", type: "обсуждение" } });
await db.postLike.create({ data: { postId: post.id, userId: U2.id } });
r = await fetch(`${BASE}/profile/achievements`, { headers: { Cookie: ckU } });
const html = await r.text();
ok(r.status === 200, `страница достижений → ${r.status} (200)`);
for (const t of ["Сосед", "Досье готово", "Первый хвост", "Хвост за хвостом"]) ok(html.includes(t), `показана заработанная ачивка «${t}»`);
ok(html.includes("4 из 6") || html.includes("Получено 4"), "счётчик «4 из 6» (helped=5→3 ачивки + досье)");
ok(html.includes("Нюх как у Шуни"), "показана незаработанная «Нюх как у Шуни» (helped 5<10)");
r = await fetch(`${BASE}/profile`, { headers: { Cookie: ckU } });
const phtml = await r.text();
ok(phtml.includes("Достижения") && phtml.includes("из 6"), "на /profile есть полоска «N из 6»");

// — уборка —
console.log("\n— Уборка —");
await db.petPhoto.deleteMany({ where: { petId: pet.id } });
await db.reportSubscription.deleteMany({ where: { reportId: report.id } });
await db.sighting.deleteMany({ where: { reportId: report.id } });
await db.notification.deleteMany({ where: { userId: { in: [U.id, U2.id] } } });
await db.postLike.deleteMany({ where: { post: { authorId: U.id } } });
await db.post.deleteMany({ where: { authorId: U.id } });
await db.lostReport.deleteMany({ where: { id: report.id } });
await db.pet.deleteMany({ where: { userId: U.id } });
await db.session.deleteMany({ where: { userId: { in: [U.id, U2.id] } } });
await db.user.deleteMany({ where: { id: { in: [U.id, U2.id] } } });
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
