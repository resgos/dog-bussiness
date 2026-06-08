// Проверка фиксов код-ревью: каскады удаления + auth/валидация reports.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
const stamp = Date.now();
const rb = (n) => randomBytes(n).toString("hex");

console.log("— Удаление аккаунта со ВСЕМИ зависимостями —");
const u = await db.user.create({ data: { name: "DelAll", email: `delall-${stamp}@e.ru`, passwordHash: "x:y", district: "khamovniki", referralCode: rb(5) } });
const sToken = rb(32);
await db.session.create({ data: { token: sToken, userId: u.id, expiresAt: new Date(Date.now() + 86400000) } });
const pet = await db.pet.create({ data: { name: "DelPet", status: "home", userId: u.id } });
await db.healthRecord.create({ data: { petId: pet.id, type: "vaccine", title: "t", date: new Date() } });
await db.walkCheckin.create({ data: { userId: u.id, lat: 55.7, lng: 37.6 } });
await db.emailVerificationToken.create({ data: { userId: u.id, token: rb(8), expiresAt: new Date(Date.now() + 86400000) } });
await db.report.create({ data: { targetType: "post", targetId: `rev-${stamp}`, reason: "spam", reporterId: u.id } });
const referred = await db.user.create({ data: { name: "Referred", email: `ref-${stamp}@e.ru`, passwordHash: "x:y", referredById: u.id, referralCode: rb(5) } });
const lost = await db.lostReport.create({ data: { petName: "DelLost", status: "active", userId: u.id } });

const res = await fetch(`${BASE}/api/account/delete`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: `lapka_session=${sToken}` }, body: "{}" });
console.log("account delete ->", res.status, "(ожидаем 200)");
await new Promise((r) => setTimeout(r, 400));
const gone = !(await db.user.findUnique({ where: { id: u.id } }));
const petGone = (await db.pet.count({ where: { id: pet.id } })) === 0;
const hrGone = (await db.healthRecord.count({ where: { petId: pet.id } })) === 0;
const refRow = await db.user.findUnique({ where: { id: referred.id } });
const lostAnon = await db.lostReport.findUnique({ where: { id: lost.id } });
console.log(`user удалён:${gone} | pet:${petGone} | healthRecord:${hrGone} | referred.referredById=${refRow?.referredById} (ожидаем null) | lost.userId=${lostAnon?.userId} (ожидаем null, объявление живо:${Boolean(lostAnon)})`);

console.log("\n— Удаление питомца с записью здоровья (API) —");
const u2 = await db.user.create({ data: { name: "PetDel", phone: `+7999${String(stamp).slice(-7)}`, passwordHash: "x:y", district: "khamovniki", referralCode: rb(5) } });
const s2 = rb(32);
await db.session.create({ data: { token: s2, userId: u2.id, expiresAt: new Date(Date.now() + 86400000) } });
const pet2 = await db.pet.create({ data: { name: "P2", status: "home", userId: u2.id } });
await db.healthRecord.create({ data: { petId: pet2.id, type: "weight", title: "w", date: new Date(), value: "5 кг" } });
const del2 = await fetch(`${BASE}/api/pets/${pet2.id}`, { method: "DELETE", headers: { Cookie: `lapka_session=${s2}` } });
console.log("pet delete ->", del2.status, "(ожидаем 200) | удалён:", (await db.pet.count({ where: { id: pet2.id } })) === 0);

console.log("\n— reports/[id] auth + валидация —");
const anon = await fetch(`${BASE}/api/reports/${lost.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "home" }) });
console.log("anon PATCH ->", anon.status, "(ожидаем 401)");
const bad = await fetch(`${BASE}/api/reports/whatever`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: `lapka_session=${s2}` }, body: JSON.stringify({ status: "garbage" }) });
console.log("bad status ->", bad.status, "(ожидаем 400)");

// уборка
await db.lostReport.deleteMany({ where: { id: lost.id } });
await db.report.deleteMany({ where: { targetId: `rev-${stamp}` } });
await db.session.deleteMany({ where: { userId: { in: [referred.id, u2.id] } } });
await db.healthRecord.deleteMany({ where: { petId: pet2.id } });
await db.pet.deleteMany({ where: { userId: u2.id } });
await db.user.deleteMany({ where: { id: { in: [referred.id, u2.id] } } });
await db.$disconnect();
console.log("\nГотово.");
