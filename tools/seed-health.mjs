// Демо-записи дневника здоровья для питомца «Шуня» (без пересева).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const day = 86_400_000;
const shunya = await db.pet.findFirst({ where: { name: "Шуня" }, orderBy: { createdAt: "desc" } });
if (!shunya) { console.log("Шуня не найдена"); await db.$disconnect(); process.exit(0); }
await db.healthRecord.deleteMany({ where: { petId: shunya.id } });
await db.healthRecord.createMany({
  data: [
    { petId: shunya.id, type: "vaccine", title: "Комплексная вакцина (DHPPi+L)", date: new Date(Date.now() - 200 * day), nextDue: new Date(Date.now() + 165 * day), note: "Клиника «Айболит»" },
    { petId: shunya.id, type: "deworming", title: "Глистогонное (Мильбемакс)", date: new Date(Date.now() - 40 * day), nextDue: new Date(Date.now() - 5 * day) },
    { petId: shunya.id, type: "weight", title: "Взвешивание", date: new Date(Date.now() - 10 * day), value: "9.8 кг" },
  ],
});
const n = await db.healthRecord.count({ where: { petId: shunya.id } });
console.log(`Шуня ${shunya.id}: записей здоровья ${n}`);
await db.$disconnect();
