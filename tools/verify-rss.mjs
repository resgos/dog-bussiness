// Проверка RSS-ленты активных пропаж (/feed/lost/rss) и ссылки на неё со страницы ленты.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const lost = await db.lostReport.create({
  data: { petName: "Тест-RSS-Барбос", status: "active", breed: "корги", district: "khamovniki", reward: 5000 },
});

const res = await fetch(`${BASE}/feed/lost/rss`);
const xml = await res.text();
ok(res.status === 200, `/feed/lost/rss → 200 (${res.status})`);
ok((res.headers.get("content-type") || "").includes("rss+xml"), "Content-Type: application/rss+xml");
ok(xml.includes("<rss") && xml.includes("<channel>") && xml.includes("</rss>"), "валидная обёртка RSS 2.0");
ok(xml.includes(`/lost/${lost.id}`), "ссылка на объявление в <item>");
ok(xml.includes("Тест-RSS-Барбос"), "кличка в <title> элемента");

// Закрытая пропажа выпадает из ленты.
await db.lostReport.update({ where: { id: lost.id }, data: { status: "home" } });
const xml2 = await (await fetch(`${BASE}/feed/lost/rss`)).text();
ok(!xml2.includes(`/lost/${lost.id}`), "снятая с публикации — вне RSS");

// Ссылка на RSS видна на странице ленты.
const feed = await (await fetch(`${BASE}/feed/lost`)).text();
ok(feed.includes("/feed/lost/rss"), "на /feed/lost есть ссылка на RSS");

// Управляющие символы из ввода не должны ломать весь XML у подписчиков.
const hasCtl = (t) => [...t].some((c) => { const n = c.codePointAt(0); return n < 32 && n !== 9 && n !== 10 && n !== 13; });
const bad = await db.lostReport.create({
  data: { petName: `Тест${String.fromCharCode(11)}Контрол${String.fromCharCode(1)}`, status: "active", district: "khamovniki" },
});
const xmlBad = await (await fetch(`${BASE}/feed/lost/rss`)).text();
ok(!hasCtl(xmlBad), "недопустимые контрол-символы вычищены из RSS");
await db.lostReport.delete({ where: { id: bad.id } }).catch(() => {});

await db.lostReport.delete({ where: { id: lost.id } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
