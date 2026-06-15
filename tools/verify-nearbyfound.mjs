// Сторож блока «Ещё находки рядом» на /found/[id]: показывает другие открытые
// находки того же района (исключая саму запись, воссоединённые и другие районы)
// + ссылку на хаб района. Свои сиды — новейшие, поэтому всегда в топ-3.
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
const mk = (breed, district, status = "open") =>
  db.foundReport
    .create({ data: { breed, district, status, color: "рыжий" } })
    .then((r) => {
      ids.push(r.id);
      return r;
    });

try {
  const a = await mk(`НаходкаА${s}`, "tverskoy");
  const b = await mk(`НаходкаБ${s}`, "tverskoy");
  const far = await mk(`НаходкаВ${s}`, "arbat");
  const done = await mk(`НаходкаГ${s}`, "tverskoy", "reunited");

  const aHtml = await (await fetch(`${BASE}/found/${a.id}`)).text();
  ok(aHtml.includes("Ещё находки"), "секция «Ещё находки рядом»");
  ok(aHtml.includes(`/found/${b.id}`), "показана соседняя находка района");
  ok(!aHtml.includes(`/found/${far.id}`), "находка другого района НЕ показана");
  ok(!aHtml.includes(`/found/${done.id}`), "воссоединённая находка НЕ показана");
  ok(aHtml.includes("/district/tverskoy"), "ссылка на хаб района");

  const bHtml = await (await fetch(`${BASE}/found/${b.id}`)).text();
  ok(bHtml.includes(`/found/${a.id}`), "блок взаимный (Б показывает А)");

  // Кросс-районная изоляция: на arbat-находке нет tverskoy-соседей.
  const farHtml = await (await fetch(`${BASE}/found/${far.id}`)).text();
  ok(
    !farHtml.includes(`/found/${a.id}`) && !farHtml.includes(`/found/${b.id}`),
    "район arbat не подмешивает соседей tverskoy",
  );
} finally {
  for (const id of ids)
    await db.foundReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
