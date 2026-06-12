// Сторож хаба района /district/[id]: страница агрегирует активные розыски,
// находки и истории возвращений конкретного района; неизвестный район → 404
// (без soft-404), а лента района ссылается на хаб.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

const DIST = "tverskoy"; // есть в src/lib/districts.ts → «Тверской»
const stamp = Date.now();
const seeded = { lost: null, found: null, reunion: null };

try {
  seeded.lost = await db.lostReport.create({
    data: {
      petName: `ХабРозыск-${stamp}`,
      breed: "Хаски",
      district: DIST,
      status: "active",
    },
  });
  seeded.found = await db.foundReport.create({
    data: {
      breed: `ХабНаходка-${stamp}`,
      color: "рыжая",
      size: "medium",
      district: DIST,
      status: "open",
    },
  });
  seeded.reunion = await db.reunion.create({
    data: {
      petName: `ХабДома-${stamp}`,
      story: "Собака нашлась за два дня благодаря соседям из района.",
      district: DIST,
    },
  });

  // 1. Хаб известного района отдаётся и агрегирует всё.
  const res = await fetch(`${BASE}/district/${DIST}`);
  ok(res.status === 200, `/district/${DIST} → 200 (${res.status})`);
  const html = await res.text();
  ok(html.includes("Тверской"), "в хабе — название района (Тверской)");
  ok(html.includes(seeded.lost.petName), "виден активный розыск района");
  ok(html.includes(seeded.found.breed), "видна находка района");
  ok(html.includes(seeded.reunion.petName), "видна история возвращения района");
  ok(
    html.includes("Активные розыски") && html.includes("Находки рядом"),
    "секции «Активные розыски» и «Находки рядом» на месте",
  );

  // 2. Неизвестный район → честный 404 (не soft-404 с кодом 200).
  const miss = await fetch(`${BASE}/district/zzz-nope-${stamp}`);
  ok(miss.status === 404, `неизвестный район → 404 (${miss.status})`);

  // 3. Лента района ссылается на хаб (путь обнаружения).
  const feed = await (
    await fetch(`${BASE}/feed/lost?district=${DIST}`)
  ).text();
  ok(
    feed.includes(`/district/${DIST}`),
    "на /feed/lost?district=… есть ссылка «Страница района»",
  );
} finally {
  if (seeded.reunion)
    await db.reunion.delete({ where: { id: seeded.reunion.id } }).catch(() => {});
  if (seeded.found)
    await db.foundReport
      .delete({ where: { id: seeded.found.id } })
      .catch(() => {});
  if (seeded.lost)
    await db.lostReport
      .delete({ where: { id: seeded.lost.id } })
      .catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
