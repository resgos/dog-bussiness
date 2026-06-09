// Демо-трек наблюдений для проверки «Траекторий» на карте.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const NAME = "Шарик-демо";
const h = (n) => new Date(Date.now() - n * 3600 * 1000);

let rep = await db.lostReport.findFirst({ where: { petName: NAME } });
if (!rep) {
  rep = await db.lostReport.create({
    data: { petName: NAME, breed: "джек-рассел", status: "active", district: "khamovniki", lat: 55.744, lng: 37.601, lostAt: h(6) },
  });
}
const count = await db.sighting.count({ where: { reportId: rep.id } });
if (count === 0) {
  const pts = [
    { lat: 55.7465, lng: 37.606, comment: "Видели у сквера", createdAt: h(4) },
    { lat: 55.749, lng: 37.611, comment: "Бежал на северо-восток", createdAt: h(2) },
    { lat: 55.7515, lng: 37.617, comment: "Замечен у пруда", createdAt: h(1) },
  ];
  for (const p of pts) await db.sighting.create({ data: { reportId: rep.id, ...p } });
  console.log(`Создан трек: ${NAME} + ${pts.length} наблюдения.`);
} else {
  console.log(`Трек уже есть: ${NAME} (${count} наблюдений).`);
}
await db.$disconnect();
