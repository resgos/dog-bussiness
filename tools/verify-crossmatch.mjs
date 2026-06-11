// Кросс-матчинг на детальных страницах: /lost/[id] ↔ /found/[id].
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

// Сильно совпадающая пара: район + порода + окрас + размер (+время).
const lost = await db.lostReport.create({
  data: { petName: "Кросс", status: "active", district: "khamovniki", breed: "корги", color: "рыжий", size: "small" },
});
const found = await db.foundReport.create({
  data: { finderName: "Матчер", contactPhone: "+70000000009", status: "open", district: "khamovniki", breed: "корги", color: "рыжий", size: "small" },
});

const lostHtml = await (await fetch(`${BASE}/lost/${lost.id}`)).text();
ok(lostHtml.includes("Похожие находки"), "/lost/[id]: секция «Похожие находки» отображается");
ok(lostHtml.includes(`/found/${found.id}`), "/lost/[id]: ссылка на совпавшую находку");
// React SSR вставляет <!-- --> между {score} и текстом — проверяем подстроку.
ok(lostHtml.includes("% совпадение"), "/lost/[id]: бейдж процента совпадения");

const foundHtml = await (await fetch(`${BASE}/found/${found.id}`)).text();
ok(foundHtml.includes("Похоже, её ищут"), "/found/[id]: секция «Похоже, её ищут»");
ok(foundHtml.includes(`/lost/${lost.id}`), "/found/[id]: ссылка на совпавшую пропажу");
ok(foundHtml.includes("Кросс"), "/found/[id]: кличка из пропажи в карточке");

// Закрытая пропажа не должна показывать матчи.
await db.lostReport.update({ where: { id: lost.id }, data: { status: "home" } });
const closedHtml = await (await fetch(`${BASE}/lost/${lost.id}`)).text();
ok(!closedHtml.includes("Похожие находки"), "снятая с публикации пропажа — без блока матчей");

await db.foundReport.delete({ where: { id: found.id } });
await db.lostReport.delete({ where: { id: lost.id } });
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
