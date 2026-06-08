// Проставляет демо-номера микрочипов питомцам без чипа (ISO 11784/11785, код РФ 643).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// Детерминированный 15-значный номер: 643 + 12 цифр из индекса.
const chipFor = (i) => "643" + String(100000000000 + i * 137).slice(-12);

const pets = await db.pet.findMany({ orderBy: { createdAt: "asc" } });
let n = 0;
for (let i = 0; i < pets.length; i++) {
  if (pets[i].chip) continue;
  await db.pet.update({ where: { id: pets[i].id }, data: { chip: chipFor(i + 1) } });
  n++;
  if (n <= 5) console.log(`chip ${chipFor(i + 1)} -> ${pets[i].name} (${pets[i].id})`);
}
console.log(`Проставлено чипов: ${n} (всего питомцев: ${pets.length}).`);
await db.$disconnect();
