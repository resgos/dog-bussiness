// Проставляет демо-награды активным объявлениям (без пересева/сброса сессий).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
await db.lostReport.updateMany({ where: { petName: "Тиша", status: "active" }, data: { reward: 5000 } });
await db.lostReport.updateMany({ where: { petName: "Бади", status: "active" }, data: { reward: 3000 } });
const n = await db.lostReport.count({ where: { reward: { not: null } } });
console.log(`rewards set; объявлений с наградой: ${n}`);
await db.$disconnect();
