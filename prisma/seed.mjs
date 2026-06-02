import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Чистим и засеваем заново (идемпотентно).
  await db.foundEvent.deleteMany();
  await db.pet.deleteMany();
  await db.owner.deleteMany();

  const anya = await db.owner.create({
    data: {
      name: "Аня",
      phone: "+7 (999) 123-45-67",
      district: "khamovniki",
      telegram: "@anya",
    },
  });

  await db.pet.create({
    data: {
      name: "Шуня",
      breed: "Корги",
      sex: "female",
      age: "adult",
      size: "small",
      color: "рыжий с белой грудкой",
      marks: JSON.stringify(["Купированный хвост / уши"]),
      marksText: "Большие уши-радары, пятнышко на носу",
      district: "khamovniki",
      temperament: JSON.stringify(["Дружелюбный к людям", "Реагирует на кличку"]),
      ownerPhone: "+7 (999) 123-45-67",
      telegram: "@anya",
      showPhone: true,
      status: "home",
      ownerId: anya.id,
    },
  });

  await db.pet.create({
    data: {
      name: "Рекс",
      breed: "Немецкая овчарка",
      sex: "male",
      age: "young",
      size: "large",
      district: "presnensky",
      ownerPhone: "+7 (999) 765-43-21",
      status: "home",
    },
  });

  // События «собак найдено сегодня» (createdAt = сейчас → сегодня).
  const names = ["Барсик", "Лайма", "Граф", "Туман", "Ника", "Жуля", "Лорд", "Ася"];
  const dists = ["khamovniki", "presnensky", "yakimanka", "tverskoy", "sokol"];
  const events = Array.from({ length: 24 }, (_, i) => ({
    petName: names[i % names.length],
    district: dists[i % dists.length],
  }));
  await db.foundEvent.createMany({ data: events });

  const [pets, found] = await Promise.all([
    db.pet.count(),
    db.foundEvent.count(),
  ]);
  console.log(`Seeded: ${pets} pets, ${found} found-events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
