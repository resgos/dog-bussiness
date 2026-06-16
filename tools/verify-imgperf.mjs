// Сторож ленивой загрузки фото в карточках-сетках: засеваем розыск и находку с
// фото, проверяем, что их карточки рендерят <img loading="lazy" decoding="async">.
// (decoding="async" специфичен нашему правке — next/image его не добавляет.)
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

// 1x1 прозрачный gif как фото-заглушка сида.
const PX = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const s = Date.now();
const clean = { losts: [], founds: [] };
try {
  const lost = await db.lostReport.create({
    data: { petName: `Перф${s}`, status: "active", district: "tverskoy", photo: PX },
  });
  clean.losts.push(lost.id);
  const feed = await (await fetch(`${BASE}/feed/lost`)).text();
  ok(
    feed.includes('loading="lazy" decoding="async"') && feed.includes("data:image/gif"),
    "лента розыска: фото карточек загружаются лениво",
  );

  const found = await db.foundReport.create({
    data: { breed: "метис", status: "open", district: "tverskoy", photo: PX },
  });
  clean.founds.push(found.id);
  const ff = await (await fetch(`${BASE}/found`)).text();
  ok(
    ff.includes('loading="lazy" decoding="async"') && ff.includes("data:image/gif"),
    "лента находок: фото карточек загружаются лениво",
  );
} finally {
  for (const id of clean.losts)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  for (const id of clean.founds)
    await db.foundReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
