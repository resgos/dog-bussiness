// Проверка финальной волны: верификация e-mail + жалоба на контент.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
const j = (b) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
const stamp = Date.now();

console.log("— Верификация e-mail —");
const u = await db.user.create({ data: { name: "VerifyTest", email: `verify-${stamp}@example.ru`, passwordHash: "x:y", district: "khamovniki" } });
const token = randomBytes(16).toString("hex");
await db.emailVerificationToken.create({ data: { userId: u.id, token, expiresAt: new Date(Date.now() + 3600000) } });
console.log("verify ->", (await fetch(`${BASE}/api/auth/verify`, j({ token }))).status);
const u2 = await db.user.findUnique({ where: { id: u.id } });
const tokGone = !(await db.emailVerificationToken.findUnique({ where: { token } }));
console.log(`emailVerifiedAt установлен: ${Boolean(u2.emailVerifiedAt)} | токен удалён: ${tokGone}`);
console.log("повтор ->", (await fetch(`${BASE}/api/auth/verify`, j({ token }))).status, "(ожидаем 400)");

console.log("\n— Жалоба на контент —");
const before = await db.report.count();
console.log("report ->", (await fetch(`${BASE}/api/report`, j({ targetType: "post", targetId: "demo-post-1", reason: "spam", comment: "проверка" }))).status, "(ожидаем 201)");
const after = await db.report.count();
const last = await db.report.findFirst({ orderBy: { createdAt: "desc" } });
console.log(`жалоб: ${before} -> ${after} | последняя: ${last?.targetType}/${last?.reason} status=${last?.status}`);
console.log("невалидная причина ->", (await fetch(`${BASE}/api/report`, j({ targetType: "post", targetId: "x", reason: "bogus" }))).status, "(ожидаем 400)");

await db.report.deleteMany({ where: { targetId: { in: ["demo-post-1", "x"] } } });
await db.emailVerificationToken.deleteMany({ where: { userId: u.id } });
await db.user.delete({ where: { id: u.id } });
await db.$disconnect();
console.log("\nГотово.");
