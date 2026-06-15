// Сторож глобального поиска /search: находит активные розыски, открытые находки
// и публичные паспорта (lost/found) по кличке/породе/окрасу/району; короткий
// запрос → подсказка; пусто → дружелюбная заглушка. Плюс SearchAction в JSON-LD
// главной (sitelinks-поиск Google). «Домашние» питомцы в выдачу не попадают.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

const stamp = Date.now();
const TAG = `ИскомыйТег${stamp}`; // общий уникальный токен (в породе всех трёх)
const cleanup = { losts: [], founds: [], pets: [] };

try {
  const lost = await db.lostReport.create({
    data: { petName: `ЛостИмя${stamp}`, breed: TAG, status: "active", district: "tverskoy" },
  });
  cleanup.losts.push(lost.id);
  const found = await db.foundReport.create({
    data: { breed: TAG, color: "рыжая", status: "open", district: "tverskoy" },
  });
  cleanup.founds.push(found.id);
  const petLost = await db.pet.create({
    data: { name: `ПетИмя${stamp}`, breed: TAG, status: "lost", district: "tverskoy" },
  });
  cleanup.pets.push(petLost.id);
  // «Домашний» питомец с тем же тегом — НЕ должен попасть в поиск (приватность).
  const petHome = await db.pet.create({
    data: { name: `ДомИмя${stamp}`, breed: TAG, status: "home", district: "tverskoy" },
  });
  cleanup.pets.push(petHome.id);

  const html = await (await fetch(`${BASE}/search?q=${encodeURIComponent(TAG)}`)).text();
  ok(html.includes(`ЛостИмя${stamp}`), "поиск находит активный розыск (по породе)");
  ok(html.includes(TAG), "поиск находит находку (порода в карточке)");
  ok(html.includes(`ПетИмя${stamp}`), "поиск находит публичный паспорт (lost)");
  ok(!html.includes(`ДомИмя${stamp}`), "«домашний» питомец НЕ в выдаче (приватность)");
  ok(
    html.includes("Розыски") && html.includes("Находки") && html.includes("Паспорта"),
    "секции Розыски / Находки / Паспорта",
  );

  // Короткий запрос → подсказка, без обращения к БД.
  const shortHtml = await (await fetch(`${BASE}/search?q=a`)).text();
  ok(shortHtml.includes("минимум 2 символа"), "короткий запрос → подсказка");

  // Нет совпадений → дружелюбная заглушка.
  const noneHtml = await (await fetch(`${BASE}/search?q=zzznet${stamp}`)).text();
  ok(noneHtml.includes("ничего не нашлось"), "нет совпадений → заглушка");

  // Поиск по названию района (Хамовники → слуг khamovniki).
  const distLost = await db.lostReport.create({
    data: { petName: `РайонИмя${stamp}`, breed: "метис", status: "active", district: "khamovniki" },
  });
  cleanup.losts.push(distLost.id);
  const distHtml = await (await fetch(`${BASE}/search?q=${encodeURIComponent("Хамовники")}`)).text();
  ok(distHtml.includes(`РайонИмя${stamp}`), "поиск по названию района (Хамовники)");

  // SearchAction в JSON-LD главной (sitelinks-поиск).
  const home = await (await fetch(`${BASE}/`)).text();
  ok(home.includes("SearchAction") && home.includes("search?q="), "SearchAction в JSON-LD главной");
} finally {
  for (const id of cleanup.losts)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.founds)
    await db.foundReport.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.pets)
    await db.pet.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
