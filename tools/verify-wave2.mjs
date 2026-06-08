// Проверка Волны 2: сброс пароля + удаление аккаунта (на одноразовых юзерах).
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";

const hash = (pw) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
};
const verify = (pw, stored) => {
  const [salt, h] = stored.split(":");
  const calc = scryptSync(pw, salt, 64);
  const orig = Buffer.from(h, "hex");
  return calc.length === orig.length && timingSafeEqual(calc, orig);
};
const j = (b) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

const stamp = Date.now();
const rEmail = `reset-${stamp}@example.ru`;
const dEmail = `del-${stamp}@example.ru`;

console.log("— Сброс пароля —");
const rUser = await db.user.create({ data: { name: "ResetTest", email: rEmail, passwordHash: hash("oldpass123"), district: "khamovniki" } });
console.log("forgot ->", (await fetch(`${BASE}/api/auth/forgot`, j({ email: rEmail }))).status);
const tok = await db.passwordResetToken.findFirst({ where: { userId: rUser.id }, orderBy: { createdAt: "desc" } });
console.log("токен создан:", Boolean(tok));
console.log("reset ->", (await fetch(`${BASE}/api/auth/reset`, j({ token: tok.token, password: "newpass789" }))).status);
const rUser2 = await db.user.findUnique({ where: { id: rUser.id } });
const tok2 = await db.passwordResetToken.findUnique({ where: { id: tok.id } });
console.log(`новый пароль работает: ${verify("newpass789", rUser2.passwordHash)} | старый больше нет: ${!verify("oldpass123", rUser2.passwordHash)} | токен помечен used: ${Boolean(tok2.usedAt)}`);
console.log("повтор токена ->", (await fetch(`${BASE}/api/auth/reset`, j({ token: tok.token, password: "another123" }))).status, "(ожидаем 400)");

console.log("\n— Удаление аккаунта —");
const dUser = await db.user.create({ data: { name: "DelTest", email: dEmail, passwordHash: hash("x"), district: "presnensky" } });
const sToken = randomBytes(32).toString("hex");
await db.session.create({ data: { token: sToken, userId: dUser.id, expiresAt: new Date(Date.now() + 86400000) } });
await db.pet.create({ data: { name: "DelPet", status: "home", userId: dUser.id } });
const lost = await db.lostReport.create({ data: { petName: "DelLost", status: "active", userId: dUser.id, district: "presnensky" } });
await db.notification.create({ data: { userId: dUser.id, type: "info", title: "t" } });
const del = await fetch(`${BASE}/api/account/delete`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: `lapka_session=${sToken}` }, body: "{}" });
console.log("delete ->", del.status);
await new Promise((r) => setTimeout(r, 300));
const gone = !(await db.user.findUnique({ where: { id: dUser.id } }));
const pets = await db.pet.count({ where: { userId: dUser.id } });
const sess = await db.session.count({ where: { userId: dUser.id } });
const notifs = await db.notification.count({ where: { userId: dUser.id } });
const lostAnon = await db.lostReport.findUnique({ where: { id: lost.id } });
console.log(`юзер удалён: ${gone} | питомцев: ${pets} | сессий: ${sess} | уведомлений: ${notifs} | объявление осталось и анонимно: ${Boolean(lostAnon)} (userId=${lostAnon?.userId})`);

// уборка
await db.lostReport.deleteMany({ where: { id: lost.id } });
await db.passwordResetToken.deleteMany({ where: { userId: rUser.id } });
await db.session.deleteMany({ where: { userId: rUser.id } });
await db.user.delete({ where: { id: rUser.id } });
await db.$disconnect();
console.log("\nГотово.");
