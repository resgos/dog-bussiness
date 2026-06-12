// «Поиск 2.0»: проброс photoHash через API (pets/found) + копирование в SOS из питомца.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
const stamp = Date.now();
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const HASH = "deadbeefcafef00d";

console.log("— photoHash через /api/pets —");
let r = await fetch(`${BASE}/api/pets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `HashPet${stamp}`, breed: "корги", photoHash: HASH }) });
let j = await r.json();
const pet = await db.pet.findUnique({ where: { id: j.id } });
ok(r.status === 201 && pet?.photoHash === HASH, `pet.photoHash сохранён (${pet?.photoHash})`);

console.log("\n— photoHash через /api/found —");
r = await fetch(`${BASE}/api/found`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ finderName: "Хэш", contactPhone: "+70000000000", breed: "метис", district: "tverskoy", photoHash: HASH }) });
j = await r.json();
const found = await db.foundReport.findUnique({ where: { id: j.id } });
ok(r.status === 201 && found?.photoHash === HASH, `foundReport.photoHash сохранён (${found?.photoHash})`);

console.log("\n— SOS копирует photoHash из карточки СВОЕГО питомца —");
// petId учитывается только для своей карточки (приватность: Pet.id публичен).
// Поэтому создаём владельца + сессию и шлём SOS от его имени.
const hp = "0123456789abcdef";
const token = randomBytes(32).toString("hex");
const owner = await db.user.create({ data: { name: `PhHashOwner${stamp}`, email: `ph+${stamp}@lapka.test` } });
await db.session.create({ data: { token, userId: owner.id, expiresAt: new Date(Date.now() + 86400000) } });
const sosPet = await db.pet.create({ data: { userId: owner.id, name: `SosHash${stamp}`, status: "home", photoHash: hp } });
r = await fetch(`${BASE}/api/sos`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: `lapka_session=${token}` }, body: JSON.stringify({ petId: sosPet.id, petName: sosPet.name, district: "khamovniki", radiusKm: 3 }) });
j = await r.json();
const lost = await db.lostReport.findUnique({ where: { id: j.id } });
ok(r.status === 201 && lost?.photoHash === hp, `lostReport.photoHash скопирован из своего питомца (${lost?.photoHash})`);

console.log("\n— уборка —");
await db.lostReport.deleteMany({ where: { id: j.id } });
await db.foundReport.deleteMany({ where: { id: found.id } });
await db.pet.deleteMany({ where: { id: { in: [pet.id, sosPet.id] } } });
await db.session.deleteMany({ where: { userId: owner.id } });
await db.user.deleteMany({ where: { id: owner.id } });
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
