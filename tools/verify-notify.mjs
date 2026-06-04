// Проверка сквозной логики: наблюдение по чужой пропаже → уведомление владельцу.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const report = await db.lostReport.findFirst({
  where: { status: "active", userId: { not: null } },
  orderBy: { createdAt: "desc" },
});
if (!report) {
  console.log("Нет активной пропажи с владельцем — нечего проверять.");
  await db.$disconnect();
  process.exit(0);
}

const before = await db.notification.count({ where: { userId: report.userId } });

const res = await fetch("http://localhost:3002/api/sightings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ reportId: report.id, comment: "Проверка: видел у набережной" }),
});
console.log("POST /api/sightings ->", res.status);

await new Promise((r) => setTimeout(r, 600));

const afterCount = await db.notification.count({ where: { userId: report.userId } });
const latest = await db.notification.findFirst({
  where: { userId: report.userId },
  orderBy: { createdAt: "desc" },
});

console.log(`Отчёт: ${report.petName} (owner ${report.userId})`);
console.log(`Уведомлений у владельца: было ${before} -> стало ${afterCount}`);
console.log(`Последнее: type=${latest?.type} | "${latest?.title}" | ${latest?.body} | link=${latest?.link}`);
await db.$disconnect();
