// Проверка печатной листовки района (/poster/district/[district]) + контекстной
// ссылки на неё со страницы ленты при выбранном районе.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const DIST = "e2e-flyer";
const a = await db.lostReport.create({ data: { petName: "Флаер-Тиша", status: "active", district: DIST, breed: "корги", reward: 5000 } });
const b = await db.lostReport.create({ data: { petName: "Флаер-Рекс", status: "active", district: DIST, breed: "метис" } });

const res = await fetch(`${BASE}/poster/district/${DIST}`);
const html = await res.text();
ok(res.status === 200, `/poster/district/[district] → 200 (${res.status})`);
ok(html.includes("Разыскиваются собаки"), "шапка листовки");
ok(html.includes("Флаер-Тиша") && html.includes("Флаер-Рекс"), "обе пропажи района на листе");
ok(html.includes("Награда"), "награда в карточке");
ok(html.includes("flyer-sheet") || html.includes("@media print"), "печатная вёрстка (print-CSS)");
ok(html.includes(`/lost/${a.id}`) || html.includes("qrcode") || html.toLowerCase().includes("<svg"), "QR-коды отрисованы");

// Пустой район — дружелюбное сообщение, без падения.
const empty = await fetch(`${BASE}/poster/district/e2e-empty-zzz`);
const emptyHtml = await empty.text();
ok(empty.status === 200 && emptyHtml.includes("нет активных пропаж"), "пустой район → дружелюбное сообщение");

// Контекстная ссылка на ленте при выбранном районе.
const feed = await (await fetch(`${BASE}/feed/lost?district=${DIST}`)).text();
ok(feed.includes(`/poster/district/${DIST}`), "ссылка на листовку на /feed/lost?district=…");

await db.lostReport.deleteMany({ where: { id: { in: [a.id, b.id] } } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
