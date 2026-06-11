// Проверка экспорта персональных данных (GET /api/account/export):
// auth-гейт, заголовки скачивания, наличие данных и отсутствие секретов.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

// Без сессии — 401.
const anon = await fetch(`${BASE}/api/account/export`);
ok(anon.status === 401, `без сессии → 401 (получено ${anon.status})`);

// Засеваем пользователя с данными.
const token = randomBytes(32).toString("hex");
const user = await db.user.create({
  data: { name: "Экспорт Тест", email: `exp+${Date.now()}@lapka.test`, district: "e2e-testovo" },
});
await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) } });
const pet = await db.pet.create({ data: { userId: user.id, name: "Тест-Питомец-Экспорт" } });
const lost = await db.lostReport.create({ data: { userId: user.id, petName: "Тест-Пропажа-Экспорт", status: "active" } });

const res = await fetch(`${BASE}/api/account/export`, { headers: { cookie: `lapka_session=${token}` } });
ok(res.status === 200, `с сессией → 200 (получено ${res.status})`);
const cd = res.headers.get("content-disposition") || "";
ok(/attachment; filename=".*\.json"/.test(cd), `Content-Disposition: attachment .json (${cd})`);
ok((res.headers.get("content-type") || "").includes("application/json"), "Content-Type: application/json");

const body = await res.json().catch(() => ({}));
ok(body?.profile?.name === "Экспорт Тест", "профиль попал в экспорт");
ok(Array.isArray(body.pets) && body.pets.some((p) => p.name === "Тест-Питомец-Экспорт"), "питомец в экспорте");
ok(Array.isArray(body.lostReports) && body.lostReports.some((r) => r.petName === "Тест-Пропажа-Экспорт"), "пропажа в экспорте");
ok(body.profile && !("passwordHash" in body.profile), "passwordHash НЕ попал в экспорт (без секретов)");

// Очистка.
await db.lostReport.deleteMany({ where: { userId: user.id } }).catch(() => {});
await db.pet.deleteMany({ where: { userId: user.id } }).catch(() => {});
await db.session.deleteMany({ where: { userId: user.id } }).catch(() => {});
await db.user.delete({ where: { id: user.id } }).catch(() => {});
await db.$disconnect();

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
