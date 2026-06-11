// Проверка, что активные пропажи и открытые находки попадают в карту сайта
// (органический канал поиска для тех, кто ищет/нашёл собаку).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const lost = await db.lostReport.create({
  data: { petName: "Тест-Sitemap-Пропажа", status: "active", district: "khamovniki" },
});
const found = await db.foundReport.create({
  data: { status: "open", district: "khamovniki" },
});

const res = await fetch(`${BASE}/sitemap.xml`);
const xml = await res.text();
ok(res.status === 200, `/sitemap.xml → 200 (${res.status})`);
ok((res.headers.get("content-type") || "").includes("xml"), "Content-Type: xml");
ok(xml.includes(`/lost/${lost.id}`), "активная пропажа /lost/[id] в карте сайта");
ok(xml.includes(`/found/${found.id}`), "открытая находка /found/[id] в карте сайта");

// Закрытая пропажа не должна индексироваться.
await db.lostReport.update({ where: { id: lost.id }, data: { status: "home" } });
const xml2 = await (await fetch(`${BASE}/sitemap.xml`)).text();
ok(!xml2.includes(`/lost/${lost.id}`), "снятая с публикации пропажа — вне карты сайта");

await db.lostReport.delete({ where: { id: lost.id } }).catch(() => {});
await db.foundReport.delete({ where: { id: found.id } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
