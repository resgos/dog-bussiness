// Проверка: публикация находки в районе активной пропажи → уведомление владельцу.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const r = await db.lostReport.findFirst({
  where: { status: "active", userId: { not: null }, district: { not: null } },
  orderBy: { createdAt: "desc" },
});
const before = await db.notification.count({ where: { userId: r.userId } });

const res = await fetch("http://localhost:3002/api/found", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ district: r.district, breed: "Лабрадор", color: "рыжий", comment: "проверка матчинга" }),
});
console.log("POST /api/found ->", res.status);
await new Promise((x) => setTimeout(x, 700));

const after = await db.notification.count({ where: { userId: r.userId } });
const latest = await db.notification.findFirst({ where: { userId: r.userId }, orderBy: { createdAt: "desc" } });
console.log(`Район ${r.district}: уведомлений у владельца ${before} -> ${after}`);
console.log(`Последнее: "${latest?.title}" | ${latest?.body} | link=${latest?.link}`);

const pet = await db.pet.findFirst({ orderBy: { createdAt: "desc" } });
console.log(`PET_ID=${pet?.id} (${pet?.name})`);
await db.$disconnect();
