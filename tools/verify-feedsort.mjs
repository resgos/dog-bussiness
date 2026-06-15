// Сторож сортировки ленты розыска (/feed/lost): клиентские контролы сортировки
// должны присутствовать в SSR-разметке LostFilters (Next рендерит клиентские
// компоненты на сервере для первичного HTML). Само переупорядочивание — клиентское
// и проверяется живым preview; здесь регрессионная сеть на наличие контролов.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

const ids = [];
try {
  // Гарантируем непустую ленту — иначе LostFilters (с контролами) не рендерится.
  const r = await db.lostReport.create({
    data: { petName: `СортСид${Date.now()}`, district: "tverskoy", status: "active" },
  });
  ids.push(r.id);

  const html = await (await fetch(`${BASE}/feed/lost`)).text();
  ok(html.includes("Сортировка"), "блок «Сортировка» присутствует");
  ok(html.includes("Сначала новые"), "опция «Сначала новые»");
  ok(html.includes("С наградой"), "опция «С наградой»");
  ok(html.includes("Дольше всех ищут"), "опция «Дольше всех ищут»");
} finally {
  for (const id of ids)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
