// Сторож облегчения выборки карты (код-ревью #3): /map отдаёт в клиентский
// SearchMap только активные розыски С координатами. Закрытые и бес-координатные
// маркеров не дают — раньше они лишь раздували RSC-payload (фото-data-URL).
// SOS-матчинг (select без фото) поведенчески покрыт verify-sosmatch в гейте.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

const s = Date.now();
const ids = [];
try {
  const active = await db.lostReport.create({
    data: { petName: `МапАкт${s}`, status: "active", district: "tverskoy", lat: 55.74, lng: 37.6 },
  });
  ids.push(active.id);
  const closed = await db.lostReport.create({
    data: { petName: `МапЗакр${s}`, status: "found", district: "tverskoy", lat: 55.75, lng: 37.61 },
  });
  ids.push(closed.id);
  const noCoords = await db.lostReport.create({
    data: { petName: `МапНеткоорд${s}`, status: "active", district: "tverskoy" },
  });
  ids.push(noCoords.id);

  const html = await (await fetch(`${BASE}/map`)).text();
  ok(html.includes(`МапАкт${s}`), "активный с координатами — в payload карты");
  ok(
    !html.includes(`МапЗакр${s}`),
    "закрытый розыск исключён (не раздувает payload)",
  );
  ok(
    !html.includes(`МапНеткоорд${s}`),
    "розыск без координат исключён (не маркер)",
  );
} finally {
  for (const id of ids)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
