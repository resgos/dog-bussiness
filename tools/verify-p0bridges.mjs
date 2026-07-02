// Сторож P0-мостов монетизации (#1 и #3 бизнес-беклога): QR-бирка ведёт в
// магазин адресников, розыскной плакат — в Лапка+. Обе цели мостов живые (200).
// CTA — в no-print панелях (на печать не попадают, стиль уже гарантирует).
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
const clean = { pets: [], reports: [] };
try {
  // Мост #1: /p/[id]/card → магазин адресников.
  const pet = await db.pet.create({
    data: { name: `Мост${s}`, status: "home", district: "tverskoy" },
  });
  clean.pets.push(pet.id);
  const card = await (await fetch(`${BASE}/p/${pet.id}/card`)).text();
  ok(
    card.includes('href="/shop/addressniki"') && card.includes("адресник"),
    "бирка: CTA «гравированный адресник» → /shop/addressniki",
  );

  // Мост #3: розыскной плакат → Лапка+.
  const report = await db.lostReport.create({
    data: { petName: `Плакат${s}`, status: "active", district: "tverskoy" },
  });
  clean.reports.push(report.id);
  const poster = await (await fetch(`${BASE}/poster/${report.id}`)).text();
  ok(
    poster.includes('href="/plus"') && poster.includes("Лапка+"),
    "плакат: мост «Лапка+» → /plus",
  );
  ok(poster.includes("no-print"), "плакат: панель no-print на месте");

  // Цели мостов живые.
  ok((await fetch(`${BASE}/shop/addressniki`)).status === 200, "/shop/addressniki → 200");
  ok((await fetch(`${BASE}/plus`)).status === 200, "/plus → 200");
} finally {
  for (const id of clean.pets)
    await db.pet.delete({ where: { id } }).catch(() => {});
  for (const id of clean.reports)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
