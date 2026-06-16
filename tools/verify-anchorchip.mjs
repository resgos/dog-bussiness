// Сторож: (1) дизайн — scroll-padding-top под липкую шапку в собранном CSS;
// (2) фича — на паспорте с микрочипом видны ссылки на нац.реестры; без чипа их нет.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

const s = Date.now();
const ids = [];
try {
  const home = await (await fetch(`${BASE}/`)).text();
  const cssHref = (home.match(/href="([^"]+\.css[^"]*)"/) || [])[1];
  const css = cssHref ? await (await fetch(`${BASE}${cssHref}`)).text() : "";
  ok(css.includes("scroll-padding-top"), "CSS: scroll-padding-top под липкую шапку");

  const pet = await db.pet.create({
    data: { name: `Чип${s}`, status: "lost", district: "tverskoy", chip: `6433${s}` },
  });
  ids.push(pet.id);
  const ph = await (await fetch(`${BASE}/p/${pet.id}`)).text();
  ok(
    ph.includes("Проверить в реестре") &&
      ph.includes("animal-id.ru") &&
      ph.includes("animalface.ru"),
    "паспорт с чипом: ссылки на реестры (Animal-ID.RU, AnimalFace)",
  );

  const noChip = await db.pet.create({
    data: { name: `БезЧипа${s}`, status: "lost", district: "tverskoy" },
  });
  ids.push(noChip.id);
  const ph2 = await (await fetch(`${BASE}/p/${noChip.id}`)).text();
  ok(!ph2.includes("Проверить в реестре"), "паспорт без чипа — без реестров");
} finally {
  for (const id of ids) await db.pet.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
