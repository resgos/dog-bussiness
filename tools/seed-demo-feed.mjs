// Демо-данные для лент: находки с приметами + size/color активным пропажам (чтобы фильтры были видны).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const founds = [
  { finderName: "Ольга", contactPhone: "+7 (901) 111-22-33", breed: "корги", color: "рыжий", size: "small", district: "khamovniki", comment: "Ласковый, в розовом ошейнике", status: "open" },
  { finderName: "Игорь", contactPhone: "+7 (902) 222-33-44", breed: "лабрадор", color: "чёрный", size: "large", district: "tverskoy", comment: "Без ошейника, у метро", status: "open" },
  { finderName: "Мария", contactTelegram: "@maria", breed: "метис", color: "белый", size: "medium", district: "presnensky", comment: "Хромает на лапу", status: "open" },
];
let n = 0;
for (const f of founds) {
  const exists = await db.foundReport.findFirst({ where: { finderName: f.finderName, breed: f.breed } });
  if (!exists) { await db.foundReport.create({ data: f }); n++; }
}
const losts = await db.lostReport.findMany({ where: { status: "active" } });
const palette = [["small", "рыжий"], ["medium", "чёрный"], ["large", "палевый"]];
let m = 0;
for (let i = 0; i < losts.length; i++) {
  if (!losts[i].size || !losts[i].color) {
    await db.lostReport.update({ where: { id: losts[i].id }, data: { size: palette[i % 3][0], color: palette[i % 3][1] } });
    m++;
  }
}
console.log(`Добавлено находок: ${n}, обновлено пропаж size/color: ${m}`);
await db.$disconnect();
