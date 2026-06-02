import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Приблизительные координаты районов (центр).
const coords = {
  khamovniki: [55.728, 37.587],
  presnensky: [55.76, 37.56],
  yakimanka: [55.735, 37.61],
  tverskoy: [55.77, 37.6],
  sokol: [55.805, 37.515],
};

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);

async function main() {
  // Порядок с учётом внешних ключей.
  await db.sighting.deleteMany();
  await db.lostReport.deleteMany();
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

  // Объявления о пропаже.
  const reports = [
    {
      petName: "Тиша",
      breed: "Джек-рассел-терьер",
      district: "khamovniki",
      comment: "Сорвался с поводка у метро, побежал в сторону парка.",
      radiusKm: 3,
      status: "active",
      lostAt: hoursAgo(2),
    },
    {
      petName: "Майя",
      breed: "Хаски",
      district: "presnensky",
      comment: "Испугалась салюта, убежала во дворы.",
      radiusKm: 5,
      status: "active",
      lostAt: hoursAgo(6),
    },
    {
      petName: "Бади",
      breed: "Метис / не знаю",
      district: "yakimanka",
      comment: "Рыжий, среднего размера, в синем ошейнике.",
      radiusKm: 1,
      status: "active",
      lostAt: hoursAgo(20),
    },
    {
      petName: "Лорд",
      breed: "Лабрадор-ретривер",
      district: "tverskoy",
      comment: "Нашёлся благодаря соседям! Спасибо стае 🧡",
      radiusKm: 3,
      status: "found",
      lostAt: hoursAgo(30),
    },
  ];

  let firstActiveId = null;
  for (const r of reports) {
    const [lat, lng] = coords[r.district] ?? coords.khamovniki;
    const created = await db.lostReport.create({
      data: { ...r, lat, lng },
    });
    if (!firstActiveId && r.status === "active") firstActiveId = created.id;
  }

  // Наблюдения по первому активному объявлению.
  if (firstActiveId) {
    const [lat, lng] = coords.khamovniki;
    await db.sighting.createMany({
      data: [
        {
          reportId: firstActiveId,
          lat: lat + 0.004,
          lng: lng + 0.006,
          comment: "Видел похожего пса у набережной, бежал к мосту.",
        },
        {
          reportId: firstActiveId,
          lat: lat - 0.003,
          lng: lng - 0.002,
          comment: "Кто-то кормил рыжего во дворе на Льва Толстого.",
        },
      ],
    });
  }

  // База событий «найдено сегодня» для счётчика.
  const names = ["Барсик", "Лайма", "Граф", "Туман", "Ника", "Жуля", "Лорд", "Ася"];
  const dists = ["khamovniki", "presnensky", "yakimanka", "tverskoy", "sokol"];
  await db.foundEvent.createMany({
    data: Array.from({ length: 24 }, (_, i) => ({
      petName: names[i % names.length],
      district: dists[i % dists.length],
    })),
  });

  const [pets, found, lost, sight] = await Promise.all([
    db.pet.count(),
    db.foundEvent.count(),
    db.lostReport.count(),
    db.sighting.count(),
  ]);
  console.log(
    `Seeded: ${pets} pets, ${lost} reports, ${sight} sightings, ${found} found-events.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
