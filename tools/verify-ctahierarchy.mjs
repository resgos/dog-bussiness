// Сторож иерархии действий на /lost/[id] (дизайн-критика №2): порядок ролей —
// сначала акцентный блок НАШЕДШЕГО («Видели X?» + «Я видел эту собаку»), затем
// «Помочь поиску» (репост-группа), затем сервисный ряд (плакат/карта вторичные).
// На закрытом розыске блока нашедшего нет, репост-группа становится
// «Поделитесь радостью».
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
    data: { petName: `Иерарх${s}`, status: "active", district: "tverskoy" },
  });
  ids.push(active.id);
  const h = await (await fetch(`${BASE}/lost/${active.id}`)).text();

  const iSeen = h.indexOf(`Видели Иерарх${s}?`);
  const iHelp = h.indexOf("Помочь поиску за 10 секунд");
  const iPoster = h.indexOf("Розыскной плакат");
  ok(iSeen > -1, "активный: акцентный блок «Видели X?»");
  ok(iHelp > -1, "активный: группа «Помочь поиску»");
  ok(
    iSeen > -1 && iHelp > -1 && iSeen < iHelp,
    "порядок: нашедший раньше репост-группы",
  );
  ok(
    iHelp > -1 && iPoster > -1 && iHelp < iPoster,
    "порядок: репост-группа раньше сервисного ряда",
  );
  ok(h.includes("Я видел эту собаку"), "кнопка «Я видел эту собаку» на месте");

  const done = await db.lostReport.create({
    data: { petName: `Закрыт${s}`, status: "found", district: "tverskoy" },
  });
  ids.push(done.id);
  const dh = await (await fetch(`${BASE}/lost/${done.id}`)).text();
  ok(!dh.includes(`Видели Закрыт${s}?`), "закрытый: блока нашедшего нет");
  ok(dh.includes("Поделитесь радостью"), "закрытый: репост-группа = «радость»");
} finally {
  for (const id of ids)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
