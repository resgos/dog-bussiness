// Сторож сортировки ленты находок (/found): клиентские контролы сортировки
// в SSR-разметке FoundList (Next рендерит клиентский компонент на сервере для
// первичного HTML). Переупорядочивание — клиентское, проверяется живым preview;
// здесь регрессионная сеть на наличие контролов.
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
  const r = await db.foundReport.create({
    data: { breed: `СортНаходка${Date.now()}`, status: "open", district: "tverskoy" },
  });
  ids.push(r.id);

  const html = await (await fetch(`${BASE}/found`)).text();
  ok(html.includes("Сортировка"), "блок «Сортировка» присутствует");
  ok(html.includes("Сначала новые"), "опция «Сначала новые»");
  ok(html.includes("Дольше всех ждут"), "опция «Дольше всех ждут»");
} finally {
  for (const id of ids)
    await db.foundReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
