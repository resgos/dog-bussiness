// Проверка: открытые находки с координатами доходят до карты (/map) — данные
// прокидываются в клиентский SearchMap (метки рисует Leaflet на клиенте, поэтому
// здесь проверяем data-flow: id находки попадает в сериализованные пропсы страницы).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

// Находка С координатами — должна попасть в пропсы карты.
const withGeo = await db.foundReport.create({
  data: { status: "open", breed: "корги", color: "рыжий", district: "khamovniki", lat: 55.742, lng: 37.591 },
});
// Находка БЕЗ координат — на карту не идёт (where lat/lng not null).
const noGeo = await db.foundReport.create({
  data: { status: "open", breed: "метис", district: "khamovniki" },
});

const res = await fetch(`${BASE}/map`);
const html = await res.text();
ok(res.status === 200, `/map → 200 (${res.status})`);
ok(html.includes(withGeo.id), "находка с координатами есть в пропсах карты");
ok(!html.includes(noGeo.id), "находка без координат на карту не идёт");

// Воссоединённая находка не показывается.
await db.foundReport.update({ where: { id: withGeo.id }, data: { status: "reunited" } });
const html2 = await (await fetch(`${BASE}/map`)).text();
ok(!html2.includes(withGeo.id), "воссоединённая находка — вне карты");

await db.foundReport.deleteMany({ where: { id: { in: [withGeo.id, noGeo.id] } } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
