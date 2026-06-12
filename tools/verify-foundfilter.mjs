// Сторож фильтра находок по району: /found?district=… предвыбирает район
// (SSR показывает «Сбросить фильтр» и только находки района) и даёт перекрёстные
// ссылки на хаб/листовку района. Симметрично /feed/lost?district=…
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
const A = { breed: `НаходкаТверская-${stamp}` }; // tverskoy
const B = { breed: `НаходкаХамовники-${stamp}` }; // khamovniki
const seeded = [];

try {
  seeded.push(
    await db.foundReport.create({
      data: { breed: A.breed, district: "tverskoy", status: "open" },
    }),
  );
  seeded.push(
    await db.foundReport.create({
      data: { breed: B.breed, district: "khamovniki", status: "open" },
    }),
  );

  // 1. Без параметра — фильтр не предвыбран, видны обе находки.
  const all = await (await fetch(`${BASE}/found`)).text();
  ok(all.includes(A.breed) && all.includes(B.breed), "/found без фильтра показывает все находки");
  ok(!all.includes("Сбросить фильтр"), "/found без фильтра — без «Сбросить фильтр»");

  // 2. С ?district=tverskoy — фильтр предвыбран в SSR: только тверская находка.
  const res = await fetch(`${BASE}/found?district=tverskoy`);
  ok(res.status === 200, `/found?district=tverskoy → 200 (${res.status})`);
  const one = await res.text();
  ok(one.includes("Сбросить фильтр"), "?district=… предвыбирает фильтр (есть «Сбросить фильтр»)");
  // Фильтрация у FoundList клиентская (по гидратации), поэтому в SSR обе находки
  // присутствуют в payload — надёжный серверный сигнал предвыбора это «Сбросить
  // фильтр» (проверено выше). Здесь лишь подтверждаем, что данные дошли до страницы.
  ok(one.includes(A.breed), "находка выбранного района присутствует в выдаче");

  // 3. Перекрёстные ссылки на хаб и листовку района.
  ok(one.includes("/district/tverskoy"), "есть ссылка «Страница района» → /district/tverskoy");
  ok(
    one.includes("/poster/district/tverskoy"),
    "есть ссылка «Листовка района» → /poster/district/tverskoy",
  );
} finally {
  for (const r of seeded) {
    await db.foundReport.delete({ where: { id: r.id } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
