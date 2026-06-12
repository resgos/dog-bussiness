// Проверка RSS-ленты открытых находок (/feed/found/rss) + ссылки со страницы находок.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const f = await db.foundReport.create({
  data: { status: "open", breed: "корги", color: "рыжий", district: "khamovniki" },
});

const res = await fetch(`${BASE}/feed/found/rss`);
const xml = await res.text();
ok(res.status === 200, `/feed/found/rss → 200 (${res.status})`);
ok((res.headers.get("content-type") || "").includes("rss+xml"), "Content-Type: application/rss+xml");
ok(xml.includes("<rss") && xml.includes("<channel>") && xml.includes("</rss>"), "валидная обёртка RSS 2.0");
ok(xml.includes(`/found/${f.id}`), "ссылка на находку в <item>");
ok(xml.includes("Найдена собака") && xml.includes("корги"), "заголовок и приметы в item");

// Воссоединённая находка выпадает из ленты.
await db.foundReport.update({ where: { id: f.id }, data: { status: "reunited" } });
const xml2 = await (await fetch(`${BASE}/feed/found/rss`)).text();
ok(!xml2.includes(`/found/${f.id}`), "воссоединённая находка — вне RSS");

// Контрол-символы из ввода не должны ломать XML.
const hasCtl = (t) => [...t].some((c) => { const n = c.codePointAt(0); return n < 32 && n !== 9 && n !== 10 && n !== 13; });
const bad = await db.foundReport.create({
  data: { status: "open", breed: "хаски", district: "khamovniki", comment: `Тест${String.fromCharCode(11)}${String.fromCharCode(1)}` },
});
const xmlBad = await (await fetch(`${BASE}/feed/found/rss`)).text();
ok(!hasCtl(xmlBad), "недопустимые контрол-символы вычищены из RSS");
await db.foundReport.delete({ where: { id: bad.id } }).catch(() => {});

// Ссылка на RSS видна на странице находок.
const feed = await (await fetch(`${BASE}/found`)).text();
ok(feed.includes("/feed/found/rss"), "на /found есть ссылка на RSS");

await db.foundReport.delete({ where: { id: f.id } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
