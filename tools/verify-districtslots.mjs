// Сторож «Друзей района» (P1 #5): на хабе района видны approved-партнёры этого
// района, featured (платное промо) раньше обычного, pending и чужой район
// скрыты, бейдж «Рекомендуем» у featured, B2B-CTA ведёт на /partners.
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
const mk = (data) =>
  db.partner
    .create({ data: { type: "vet", status: "approved", ...data } })
    .then((p) => {
      ids.push(p.id);
      return p;
    });

try {
  // Сиды в arbat: featured + обычный + pending + чужой район.
  const feat = await mk({ name: `ПромоВет${s}`, district: "arbat", featured: true });
  const plain = await mk({ name: `Грумер${s}`, district: "arbat", type: "groomer" });
  const pending = await mk({
    name: `Заявка${s}`,
    district: "arbat",
    status: "pending",
  });
  const other = await mk({ name: `Чужой${s}`, district: "sokol" });

  const html = await (await fetch(`${BASE}/district/arbat`)).text();
  ok(html.includes("Друзья района"), "хаб: секция «Друзья района»");
  ok(
    html.includes(feat.name) && html.includes(plain.name),
    "оба approved-партнёра района видны",
  );
  ok(
    html.indexOf(feat.name) < html.indexOf(plain.name),
    "featured (платное промо) раньше обычного",
  );
  ok(html.includes("Рекомендуем"), "featured: бейдж «Рекомендуем»");
  ok(!html.includes(pending.name), "pending-заявка скрыта (модерация)");
  ok(!html.includes(other.name), "партнёр другого района скрыт");
  ok(
    html.includes('href="/partners"') && html.includes("Разместить свой сервис"),
    "B2B-CTA «Разместить свой сервис» → /partners",
  );

  // Район без партнёров — секции нет (проверяем только если он реально пуст).
  const daniCount = await db.partner.count({
    where: { district: "danilovsky", status: "approved" },
  });
  if (daniCount === 0) {
    const dani = await (await fetch(`${BASE}/district/danilovsky`)).text();
    ok(!dani.includes("Друзья района"), "район без партнёров — секции нет");
  } else {
    console.log("  · danilovsky не пуст — негативный ассерт пропущен");
  }
} finally {
  for (const id of ids) await db.partner.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
