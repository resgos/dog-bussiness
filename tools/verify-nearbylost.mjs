// Сторож блока «Ещё ищут рядом» на /lost/[id]: показывает другие активные
// розыски того же района (исключая саму запись, закрытые и другие районы) и
// ссылку на хаб района. Свои сиды — новейшие, поэтому всегда в топ-3.
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
const mk = (petName, district, status = "active") =>
  db.lostReport
    .create({ data: { petName, district, status } })
    .then((r) => {
      ids.push(r.id);
      return r;
    });

try {
  const a = await mk(`СоседА${s}`, "tverskoy");
  const b = await mk(`СоседБ${s}`, "tverskoy");
  const far = await mk(`ДалёкийВ${s}`, "arbat");
  const done = await mk(`ЗакрытыйГ${s}`, "tverskoy", "found");

  const aHtml = await (await fetch(`${BASE}/lost/${a.id}`)).text();
  ok(aHtml.includes("Ещё ищут"), "секция «Ещё ищут рядом» на странице розыска");
  ok(aHtml.includes(`/lost/${b.id}`), "показан сосед того же района");
  ok(!aHtml.includes(`/lost/${far.id}`), "розыск другого района НЕ показан");
  ok(!aHtml.includes(`/lost/${done.id}`), "закрытый розыск НЕ показан");
  ok(aHtml.includes("/district/tverskoy"), "ссылка на хаб района");

  const bHtml = await (await fetch(`${BASE}/lost/${b.id}`)).text();
  ok(bHtml.includes(`/lost/${a.id}`), "блок взаимный (Б показывает А)");

  // Кросс-районная изоляция: на странице arbat-розыска нет tverskoy-соседей
  // (устойчиво к прочим данным района arbat — проверяем по id своих сидов).
  const farHtml = await (await fetch(`${BASE}/lost/${far.id}`)).text();
  ok(
    !farHtml.includes(`/lost/${a.id}`) && !farHtml.includes(`/lost/${b.id}`),
    "район arbat не подмешивает соседей tverskoy",
  );
} finally {
  for (const id of ids)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
