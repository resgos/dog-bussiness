// Сторож репоста в мессенджеры на /lost/[id]: deep-links Telegram/ВК/WhatsApp с
// абсолютным URL розыска; только для активных розысков (закрытые — без блока).
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
  const lost = await db.lostReport.create({
    data: { petName: `Репост${s}`, status: "active", district: "tverskoy" },
  });
  ids.push(lost.id);

  const html = await (await fetch(`${BASE}/lost/${lost.id}`)).text();
  ok(html.includes("Репост"), "блок «Репост» присутствует");
  ok(
    html.includes("t.me/share/url") && html.includes(`lost%2F${lost.id}`),
    "Telegram deep-link с абсолютным URL розыска",
  );
  ok(html.includes("vk.com/share.php"), "ВКонтакте deep-link");
  ok(
    html.includes("api.whatsapp.com/send") || html.includes("wa.me"),
    "WhatsApp deep-link",
  );

  // Закрытый розыск — без мессенджер-репоста (гейт на active).
  const done = await db.lostReport.create({
    data: { petName: `Закрыт${s}`, status: "found", district: "tverskoy" },
  });
  ids.push(done.id);
  const doneHtml = await (await fetch(`${BASE}/lost/${done.id}`)).text();
  ok(
    !doneHtml.includes("t.me/share/url"),
    "закрытый розыск — без мессенджер-репоста",
  );
} finally {
  for (const id of ids)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
