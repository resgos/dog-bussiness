// Сторож витрины экономики на /pulse: дельта-подход — читаем машиночитаемые
// data-revenue-total / data-donated-total до и после сида Purchase; дельты
// должны совпасть с засеянными суммами (устойчиво к фоновым данным). Донаты
// не смешиваются с выручкой сервисов (честное разделение).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

const readTotals = async () => {
  const html = await (await fetch(`${BASE}/pulse`)).text();
  const rev = Number((html.match(/data-revenue-total="(\d+)"/) || [])[1] ?? 0);
  const don = Number((html.match(/data-donated-total="(\d+)"/) || [])[1] ?? 0);
  return { html, rev, don };
};

const s = Date.now();
const ids = [];
try {
  const before = await readTotals();

  // Сид: выручка сервисов (буст 299 + расклейка 990) и донат 300.
  for (const [kind, amountRub] of [
    ["boost", 299],
    ["poster-service", 990],
    ["reward-donation", 300],
  ]) {
    const p = await db.purchase.create({
      data: { kind, amountRub, refId: `verify-revenue-${s}` },
    });
    ids.push(p.id);
  }

  const after = await readTotals();
  ok(after.html.includes("Экономика платформы"), "блок «Экономика платформы»");
  ok(
    after.rev - before.rev === 1289,
    `выручка сервисов: дельта 1289 ₽ (299+990), факт ${after.rev - before.rev}`,
  );
  ok(
    after.don - before.don === 300,
    `донаты: дельта 300 ₽ (не смешаны с выручкой), факт ${after.don - before.don}`,
  );
  ok(
    after.html.includes("Продвижение объявлений") &&
      after.html.includes("Расклейка плакатов"),
    "разбивка по каналам с человекочитаемыми лейблами",
  );
  ok(
    after.html.includes("Соседи собрали на награды"),
    "карточка денег сообщества",
  );
} finally {
  for (const id of ids)
    await db.purchase.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
