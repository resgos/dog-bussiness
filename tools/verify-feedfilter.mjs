// Проверка глубоких ссылок на ленту пропаж по району (?district=…) и того, что
// строки районов в «Пульсе» стали кликабельными ссылками в ленту.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const DIST = "e2e-feedfilter";
const lost = await db.lostReport.create({
  data: { petName: "Тест-Фильтр-Пёс", status: "active", district: DIST, breed: "корги" },
});

// Ссылка ?district=… предвыбирает фильтр района → в SSR появляется «Сбросить фильтры».
const withParam = await (await fetch(`${BASE}/feed/lost?district=${DIST}`)).text();
ok(withParam.includes("Сбросить фильтры"),
  "?district=… предвыбирает фильтр района (есть «Сбросить фильтры»)");

// Без параметра фильтр не активен.
const noParam = await (await fetch(`${BASE}/feed/lost`)).text();
ok(!noParam.includes("Сбросить фильтры"), "без параметра фильтр не активен");
ok(noParam.includes("Активные поиски"), "лента открывается (заголовок на месте)");

// «Пульс»: строки районов теперь ссылки в ленту района.
const pulse = await (await fetch(`${BASE}/pulse`)).text();
ok(pulse.includes("/feed/lost?district="), "в «Пульсе» районы стали ссылками в ленту");

await db.lostReport.delete({ where: { id: lost.id } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
