// Сторож репоста в мессенджеры (Telegram/ВК/WhatsApp) на всех публичных
// discovery-поверхностях: розыск /lost (active), находка /found (open) и паспорт
// /p (lost). Закрытые/воссоединённые/домашние — без блока (гейт по статусу).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};
const get = async (p) => (await fetch(`${BASE}${p}`)).text();

const s = Date.now();
const clean = { losts: [], founds: [], pets: [] };
try {
  // --- Розыск (active) ---
  const lost = await db.lostReport.create({
    data: { petName: `Репост${s}`, status: "active", district: "tverskoy" },
  });
  clean.losts.push(lost.id);
  const lh = await get(`/lost/${lost.id}`);
  ok(lh.includes("Репост"), "розыск: блок «Репост»");
  ok(
    lh.includes("t.me/share/url") && lh.includes(`lost%2F${lost.id}`),
    "розыск: Telegram deep-link с URL розыска",
  );
  ok(
    lh.includes("vk.com/share.php") &&
      (lh.includes("api.whatsapp.com/send") || lh.includes("wa.me")),
    "розыск: ВКонтакте + WhatsApp",
  );
  const doneLost = await db.lostReport.create({
    data: { petName: `Закрыт${s}`, status: "found", district: "tverskoy" },
  });
  clean.losts.push(doneLost.id);
  ok(
    !(await get(`/lost/${doneLost.id}`)).includes("t.me/share/url"),
    "закрытый розыск — без репоста",
  );

  // --- Находка (open) ---
  const found = await db.foundReport.create({
    data: { breed: "метис", status: "open", district: "tverskoy" },
  });
  clean.founds.push(found.id);
  const fh = await get(`/found/${found.id}`);
  ok(
    fh.includes("Репост") &&
      fh.includes("t.me/share/url") &&
      fh.includes(`found%2F${found.id}`),
    "находка: репост с URL находки",
  );
  const reunited = await db.foundReport.create({
    data: { breed: "метис", status: "reunited", district: "tverskoy" },
  });
  clean.founds.push(reunited.id);
  ok(
    !(await get(`/found/${reunited.id}`)).includes("t.me/share/url"),
    "воссоединённая находка — без репоста",
  );

  // --- Паспорт (lost) ---
  const lostPet = await db.pet.create({
    data: { name: `РепостПет${s}`, status: "lost", district: "tverskoy" },
  });
  clean.pets.push(lostPet.id);
  const ph = await get(`/p/${lostPet.id}`);
  ok(
    ph.includes("Репост") &&
      ph.includes("t.me/share/url") &&
      ph.includes(`p%2F${lostPet.id}`),
    "паспорт разыскиваемого: репост с URL паспорта",
  );
  const homePet = await db.pet.create({
    data: { name: `ДомаПет${s}`, status: "home", district: "tverskoy" },
  });
  clean.pets.push(homePet.id);
  ok(
    !(await get(`/p/${homePet.id}`)).includes("t.me/share/url"),
    "домашний питомец — без репоста",
  );
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
