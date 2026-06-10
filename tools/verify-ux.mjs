// UI-волны (детальные страницы + кликабельность + лайтбокс): деterministic-проверка.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const get = async (p) => { const r = await fetch(`${BASE}${p}`); return { s: r.status, h: await r.text() }; };

// Берём реальные сущности (создаём недостающие для теста).
const lost = await db.lostReport.findFirst({ where: { status: "active" } })
  ?? await db.lostReport.create({ data: { petName: "UX-Тест", status: "active", district: "khamovniki", comment: "тестовая пропажа" } });
const found = await db.foundReport.findFirst({ where: { status: "open" } });
const adoption = await db.adoptionListing.findFirst();
const reunion = await db.reunion.findFirst()
  ?? await db.reunion.create({ data: { petName: "UX-Хвост", story: "Вернулся домой благодаря стае! Спасибо всем, кто репостил.", district: "khamovniki" } });
const pet = await db.pet.findFirst({ where: { photo: { not: null } } }) ?? await db.pet.findFirst();

console.log("— Детальные страницы —");
{
  const { s, h } = await get(`/lost/${lost.id}`);
  ok(s === 200 && h.includes(lost.petName), `/lost/[id] → ${s}, кличка на странице`);
  ok(h.includes("Наблюдени"), "/lost/[id] содержит секцию наблюдений");
  ok(h.includes(`/poster/${lost.id}`), "/lost/[id] ссылается на плакат");
}
if (found) {
  const { s, h } = await get(`/found/${found.id}`);
  ok(s === 200 && (h.includes("хозяин") || h.includes("Ищем")), `/found/[id] → ${s}`);
} else { console.log("  · находок нет — пропуск /found/[id]"); }
if (adoption) {
  const { s, h } = await get(`/adoption/${adoption.id}`);
  ok(s === 200 && h.includes(adoption.name), `/adoption/[id] → ${s}, имя на странице`);
} else { console.log("  · приютских нет — пропуск /adoption/[id]"); }
{
  const { s, h } = await get(`/reunited/${reunion.id}`);
  ok(s === 200 && h.includes(reunion.petName) && h.includes(reunion.story.slice(0, 30)), `/reunited/[id] → ${s}, полный текст истории`);
}
{
  const { s } = await get(`/lost/нет-такого`);
  ok(s === 404, `несуществующая пропажа → ${s} (404)`);
}

console.log("\n— Кликабельность карточек (stretched-link в HTML) —");
{
  const { h } = await get("/feed/lost");
  ok(h.includes(`href="/lost/`), "лента пропаж: карточки ссылаются на /lost/[id]");
  ok(h.includes("Подробнее"), "stretched-link с aria-label/sr-only на месте");
}
{
  const { h } = await get("/found");
  ok(!found || h.includes(`href="/found/`), "лента находок: ссылки на /found/[id]");
}
{
  const { h } = await get("/adoption");
  ok(!adoption || h.includes(`href="/adoption/`), "приюты: ссылки на /adoption/[id]");
}
{
  const { h } = await get("/reunited");
  ok(h.includes(`href="/reunited/${reunion.id}`), "истории: ссылки на /reunited/[id]");
}

console.log("\n— Лайтбокс и анимации —");
{
  const { h } = await get(`/p/${pet.id}`);
  ok(pet.photo ? h.includes("Открыть фото") : true, "паспорт: главное фото — кнопка лайтбокса");
}
{
  const { h } = await get(`/lost/${lost.id}`);
  ok(lost.photo ? h.includes("Открыть фото") : true, "/lost/[id]: фото-лайтбокс (если фото есть)");
}
{
  const { h } = await get("/services");
  ok(h.includes("hover:-translate-y-1"), "карточки сервисов: hover-подъём в разметке");
}

// Уборка только созданного этим скриптом
if (lost.petName === "UX-Тест") await db.lostReport.delete({ where: { id: lost.id } });
if (reunion.petName === "UX-Хвост") await db.reunion.delete({ where: { id: reunion.id } });
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
