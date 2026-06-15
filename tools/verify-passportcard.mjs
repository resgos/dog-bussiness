// Сторож печатной QR-бирки питомца (/p/[id]/card): маршрут рендерит карточку с
// кличкой, призывом «Отсканируйте», ссылкой на паспорт и номером чипа; сам
// паспорт ссылается на печать бирки; неизвестный питомец → 404.
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
let petId = null;
try {
  const pet = await db.pet.create({
    data: {
      name: `Бирка${s}`,
      breed: "корги",
      color: "рыжий",
      district: "tverskoy",
      chip: `6433${s}`,
      status: "home",
    },
  });
  petId = pet.id;

  const res = await fetch(`${BASE}/p/${pet.id}/card`);
  const html = await res.text();
  ok(res.status === 200, "GET /p/{id}/card → 200");
  ok(html.includes(`Бирка${s}`), "бирка содержит кличку");
  ok(html.includes("Отсканируйте"), "бирка: призыв «Отсканируйте»");
  ok(html.includes(`href="/p/${pet.id}"`), "бирка: ссылка «К паспорту»");
  ok(html.includes(`6433${s}`), "бирка: номер микрочипа");
  ok(/Печать/.test(html), "бирка: кнопка печати");

  // На самом паспорте — ссылка на печать бирки.
  const passport = await (await fetch(`${BASE}/p/${pet.id}`)).text();
  ok(
    passport.includes(`/p/${pet.id}/card`) && passport.includes("QR-бирка"),
    "паспорт ссылается на QR-бирку",
  );

  // Несуществующий питомец → 404.
  const r404 = await fetch(`${BASE}/p/zzznetpet${s}/card`);
  ok(r404.status === 404, "неизвестный питомец → 404");
} finally {
  if (petId) await db.pet.delete({ where: { id: petId } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
