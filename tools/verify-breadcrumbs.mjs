// Сторож видимых «хлебных крошек» на детальных страницах /lost, /found, /p:
// nav[aria-label="Хлебные крошки"] с кликабельными предками и текущей страницей
// (aria-current). Видимое и schema.org BreadcrumbList кормятся одним массивом.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};
const NAV = 'aria-label="Хлебные крошки"';

const s = Date.now();
const clean = { losts: [], founds: [], pets: [] };
try {
  const lost = await db.lostReport.create({
    data: { petName: `КрошкаЛост${s}`, status: "active", district: "tverskoy" },
  });
  clean.losts.push(lost.id);
  const found = await db.foundReport.create({
    data: { breed: "метис", status: "open", district: "tverskoy" },
  });
  clean.founds.push(found.id);
  const pet = await db.pet.create({
    data: { name: `КрошкаПет${s}`, status: "lost", district: "tverskoy" },
  });
  clean.pets.push(pet.id);

  const lh = await (await fetch(`${BASE}/lost/${lost.id}`)).text();
  ok(lh.includes(NAV), "/lost: nav «Хлебные крошки»");
  ok(
    lh.includes("Лента розыска") && lh.includes('href="/feed/lost"'),
    "/lost: крошка «Лента розыска» → /feed/lost",
  );
  ok(lh.includes('aria-current="page"'), "/lost: текущая страница — aria-current");

  const fh = await (await fetch(`${BASE}/found/${found.id}`)).text();
  ok(fh.includes(NAV) && fh.includes("Находки"), "/found: nav + крошка «Находки»");

  const ph = await (await fetch(`${BASE}/p/${pet.id}`)).text();
  ok(ph.includes(NAV) && ph.includes("Главная"), "/p: nav + крошка «Главная»");
  ok(ph.includes(`КрошкаПет${s}`), "/p: текущая крошка — кличка питомца");
} finally {
  for (const id of clean.losts)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  for (const id of clean.founds)
    await db.foundReport.delete({ where: { id } }).catch(() => {});
  for (const id of clean.pets)
    await db.pet.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
