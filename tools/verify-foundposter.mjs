// Проверка печатного плаката «Найдена собака» (/found/[id]/poster) и ссылки на него
// со страницы находки.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const found = await db.foundReport.create({
  data: {
    status: "open", breed: "корги", color: "рыжий", size: "small",
    district: "khamovniki", contactPhone: "+70000000123", finderName: "Тест-Нашёл",
    comment: "добрый, в ошейнике",
  },
});

const res = await fetch(`${BASE}/found/${found.id}/poster`);
const html = await res.text();
ok(res.status === 200, `/found/[id]/poster → 200 (${res.status})`);
ok(html.includes("Найдена собака"), "шапка «Найдена собака»");
ok(html.includes("Ищем хозяина"), "подзаголовок «Ищем хозяина»");
ok(html.includes("Где нашли"), "блок «Где нашли» (район/дата)");
ok(html.includes("+70000000123"), "телефон нашедшего на плакате");
ok(html.includes("Приметы"), "блок «Приметы» (комментарий)");
ok(html.includes("poster-sheet"), "печатный лист (print-CSS)");
ok(html.includes("Лапка помощи"), "брендинг");

// Страница находки ссылается на плакат.
const detail = await (await fetch(`${BASE}/found/${found.id}`)).text();
ok(detail.includes(`/found/${found.id}/poster`), "на /found/[id] есть кнопка «Плакат»");

await db.foundReport.delete({ where: { id: found.id } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
