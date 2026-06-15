// Сторож «Я видел эту собаку»: со страницы активного розыска /lost/[id] есть
// прямой путь отметить наблюдение — кнопка ведёт на /map?report=…&see=1 (карта
// наводится на розыск и открывает форму наблюдения). У завершённого розыска
// кнопки нет. Фокус карты и модалка — клиентские (проверяются живым браузером);
// тут — HTTP-наблюдаемая часть: ссылки на странице + рендер /map.
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
const cleanup = { losts: [] };

try {
  const active = await db.lostReport.create({
    data: { petName: `Видел-${stamp}`, status: "active", district: "tverskoy", lat: 55.76, lng: 37.61 },
  });
  cleanup.losts.push(active.id);
  const h = await (await fetch(`${BASE}/lost/${active.id}`)).text();
  ok(h.includes("Я видел эту собаку"), "активный розыск: кнопка «Я видел эту собаку»");
  ok(
    h.includes(`/map?report=${active.id}`) && h.includes("see=1"),
    "ведёт на карту этого розыска с открытием формы наблюдения (see=1)",
  );

  // see=1 → форма наблюдения для этого розыска открыта сразу (модалка рендерится
  // из начального состояния SSR-ом). Отличительный маркер — placeholder поля.
  const see = await fetch(`${BASE}/map?report=${active.id}&see=1`);
  ok(see.status === 200, `/map?report=…&see=1 → 200 (${see.status})`);
  const seeHtml = await see.text();
  ok(seeHtml.includes("Где и когда видели"), "see=1: форма наблюдения открыта (модалка в разметке)");
  ok(seeHtml.includes(active.petName), "see=1: модалка про нужный розыск (кличка)");

  // Без see — карта открывается, но форма наблюдения НЕ всплывает сама.
  const plain = await (await fetch(`${BASE}/map?report=${active.id}`)).text();
  ok(!plain.includes("Где и когда видели"), "без see=1: форма наблюдения не открыта автоматически");

  // Завершённый розыск (home/found) — кнопки наблюдения нет.
  const done = await db.lostReport.create({
    data: { petName: `Дома-${stamp}`, status: "home", district: "tverskoy" },
  });
  cleanup.losts.push(done.id);
  const dh = await (await fetch(`${BASE}/lost/${done.id}`)).text();
  ok(!dh.includes("Я видел эту собаку"), "завершённый розыск: кнопки «Я видел» нет");
} finally {
  for (const id of cleanup.losts)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
