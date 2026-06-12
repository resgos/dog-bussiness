// В dev/тестах rate-limit выключен (RL_ENABLED): подряд можно подать больше лимита
// SOS без 429 — это убирает флак E2E (раньше 6-й SOS в минуту ловил 429). В
// production лимит включён. Проверяем: 7 SOS подряд проходят без единого 429.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const ids = [];
let any429 = false;
for (let i = 0; i < 7; i++) {
  const res = await fetch(`${BASE}/api/sos`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ petName: `Тест-Лимит-${i}`, district: "e2e-ratelimit" }),
  });
  if (res.status === 429) any429 = true;
  const j = await res.json().catch(() => ({}));
  if (j.id) ids.push(j.id);
}

ok(!any429, "7 SOS подряд без 429 (лимит выключен вне production)");
ok(ids.length === 7, `все 7 SOS созданы (создано ${ids.length})`);

await db.lostReport.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
