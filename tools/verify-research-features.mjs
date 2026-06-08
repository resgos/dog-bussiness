// Проверка ресёрч-фич: поиск по чипу (+уведомление владельца), чек-лист поиска
// (owner-guard + фильтрация ключей), сохранение chip в PATCH питомца.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
const stamp = Date.now();
const rb = (n) => randomBytes(n).toString("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0,
  fail = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "  ✓" : "  ✗ FAIL"} ${msg}`);
  cond ? pass++ : fail++;
};

// — окружение —
const chip = "643" + String(stamp).slice(-12); // уникальный 15-значный номер
const u = await db.user.create({
  data: { name: "ChipOwner", email: `chip-${stamp}@e.ru`, passwordHash: "x:y", district: "khamovniki", referralCode: rb(5) },
});
const sToken = rb(32);
await db.session.create({ data: { token: sToken, userId: u.id, expiresAt: new Date(Date.now() + 86400000) } });
const cookie = `lapka_session=${sToken}`;
const pet = await db.pet.create({
  data: { name: "Чипа", breed: "корги", status: "home", userId: u.id, chip, showPhone: true, ownerPhone: "+7 (901) 222-33-44", district: "khamovniki" },
});

console.log("— Поиск по номеру чипа —");
let r = await fetch(`${BASE}/api/chip?n=${chip}`);
let j = await r.json();
ok(r.status === 200 && j.found === true, `найден по точному номеру (status ${r.status}, found ${j.found})`);
ok(j.pet?.id === pet.id && j.pet?.name === "Чипа", `вернулся верный питомец (${j.pet?.name})`);
ok(j.contact?.phone === "+7 (901) 222-33-44", `контакт раскрыт при showPhone=true (${j.contact?.phone})`);
ok(j.pet?.district === "Хамовники", `район отрезолвлен в название (${j.pet?.district})`);

// ввод с пробелами/буквами нормализуется в цифры
r = await fetch(`${BASE}/api/chip?n=${encodeURIComponent(`№ ${chip.slice(0, 3)} ${chip.slice(3)}`)}`);
j = await r.json();
ok(j.found === true && j.pet?.id === pet.id, "номер с пробелами/символами нормализуется и находится");

// слишком короткий ввод
r = await fetch(`${BASE}/api/chip?n=123`);
j = await r.json();
ok(j.found === false, "короткий ввод (<6 цифр) → found:false");

// несуществующий чип
r = await fetch(`${BASE}/api/chip?n=643000000000000`);
j = await r.json();
ok(j.found === false, "несуществующий чип → found:false");

// уведомление владельцу о проверке чипа
await sleep(400);
const notif = await db.notification.findFirst({
  where: { userId: u.id, type: "found" },
  orderBy: { createdAt: "desc" },
});
ok(Boolean(notif) && notif.link === `/p/${pet.id}`, `владельцу пришло уведомление о проверке чипа (link ${notif?.link})`);

console.log("\n— Приватность: showPhone=false скрывает контакт —");
const chip2 = "643" + String(stamp + 7).slice(-12);
const pet2 = await db.pet.create({ data: { name: "Тихоня", status: "home", userId: u.id, chip: chip2, showPhone: false, ownerPhone: "+7 (905) 000-11-22" } });
r = await fetch(`${BASE}/api/chip?n=${chip2}`);
j = await r.json();
ok(j.found === true && j.contact === null, `найден, но контакт скрыт (contact ${JSON.stringify(j.contact)})`);

console.log("\n— Сохранение chip в PATCH питомца —");
const newChip = "643" + String(stamp + 99).slice(-12);
r = await fetch(`${BASE}/api/pets/${pet.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ name: "Чипа", chip: newChip, status: "home" }),
});
ok(r.status === 200, `PATCH принят (status ${r.status})`);
const petAfter = await db.pet.findUnique({ where: { id: pet.id } });
ok(petAfter?.chip === newChip, `chip обновился в БД (${petAfter?.chip})`);

console.log("\n— Чек-лист поиска: сохранение + фильтрация ключей —");
const lost = await db.lostReport.create({ data: { petName: "Чипа", status: "active", userId: u.id, district: "khamovniki" } });
r = await fetch(`${BASE}/api/checklist`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ reportId: lost.id, steps: ["poster", "chip", "ИНЪЕКЦИЯ", "yard", "yard", 42] }),
});
j = await r.json();
ok(r.status === 200 && j.ok === true, `POST принят (status ${r.status})`);
const lostAfter = await db.lostReport.findUnique({ where: { id: lost.id } });
const saved = JSON.parse(lostAfter?.checklist || "[]");
ok(
  JSON.stringify(saved) === JSON.stringify(["poster", "chip", "yard"]),
  `сохранены только валидные ключи без дублей: ${JSON.stringify(saved)}`,
);

console.log("\n— Чек-лист: доступ только владельцу —");
r = await fetch(`${BASE}/api/checklist`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ reportId: lost.id, steps: ["vets"] }),
});
ok(r.status === 401, `аноним → 401 (получили ${r.status})`);

const u2 = await db.user.create({ data: { name: "Chужой", email: `stranger-${stamp}@e.ru`, passwordHash: "x:y", referralCode: rb(5) } });
const s2 = rb(32);
await db.session.create({ data: { token: s2, userId: u2.id, expiresAt: new Date(Date.now() + 86400000) } });
r = await fetch(`${BASE}/api/checklist`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: `lapka_session=${s2}` },
  body: JSON.stringify({ reportId: lost.id, steps: ["vets"] }),
});
ok(r.status === 404, `чужой пользователь → 404 (получили ${r.status})`);

console.log("\n— Страницы рендерятся (live) —");
for (const [path, needle, ck] of [
  ["/guide/lost", "24 часа", null],
  ["/guide/found", "вернуть", null],
  ["/guide", "Гайды", null],
  ["/chip", "чип", null],
  [`/profile/my-searches/${lost.id}/checklist`, "Чек-лист", cookie],
]) {
  const res = await fetch(`${BASE}${path}`, ck ? { headers: { Cookie: ck } } : undefined);
  const html = await res.text();
  ok(res.status === 200 && html.includes(needle), `${path} → 200 и содержит «${needle}» (status ${res.status})`);
}

// — уборка —
console.log("\n— Уборка —");
await db.lostReport.deleteMany({ where: { userId: { in: [u.id] } } });
await db.notification.deleteMany({ where: { userId: u.id } });
await db.pet.deleteMany({ where: { userId: u.id } });
await db.session.deleteMany({ where: { userId: { in: [u.id, u2.id] } } });
await db.user.deleteMany({ where: { id: { in: [u.id, u2.id] } } });
await db.$disconnect();

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
