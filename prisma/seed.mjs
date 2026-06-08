import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const db = new PrismaClient();

function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

const coords = {
  khamovniki: [55.728, 37.587],
  presnensky: [55.76, 37.56],
  yakimanka: [55.735, 37.61],
  tverskoy: [55.77, 37.6],
  sokol: [55.805, 37.515],
};
const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);

async function main() {
  // Чистим в порядке внешних ключей.
  await db.notification.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.product.deleteMany();
  await db.postLike.deleteMany();
  await db.comment.deleteMany();
  await db.post.deleteMany();
  await db.session.deleteMany();
  await db.sighting.deleteMany();
  await db.lostReport.deleteMany();
  await db.foundEvent.deleteMany();
  await db.foundReport.deleteMany();
  await db.healthRecord.deleteMany();
  await db.pet.deleteMany();
  await db.owner.deleteMany();
  await db.user.deleteMany();

  // Демо-пользователь.
  const anyaUser = await db.user.create({
    data: {
      name: "Аня",
      phone: "+79991234567",
      email: "anya@example.ru",
      passwordHash: hashPassword("demo1234"),
      district: "khamovniki",
      telegram: "@anya",
      role: "volunteer",
      helpedCount: 3,
    },
  });

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
      photo: "/shunya/pose-happy-cut.png",
      status: "home",
      ownerId: anya.id,
      userId: anyaUser.id,
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
      photo: "/shunya/pose-grumpy-cut.png",
      status: "home",
      userId: anyaUser.id,
    },
  });

  // Объявления о пропаже.
  const reports = [
    { petName: "Тиша", breed: "Джек-рассел-терьер", district: "khamovniki", comment: "Сорвался с поводка у метро, побежал в сторону парка.", radiusKm: 3, reward: 5000, status: "active", lostAt: hoursAgo(2) },
    { petName: "Майя", breed: "Хаски", district: "presnensky", comment: "Испугалась салюта, убежала во дворы.", radiusKm: 5, status: "active", lostAt: hoursAgo(6) },
    { petName: "Бади", breed: "Метис / не знаю", district: "yakimanka", comment: "Рыжий, среднего размера, в синем ошейнике.", radiusKm: 1, reward: 3000, status: "active", lostAt: hoursAgo(20) },
    { petName: "Лорд", breed: "Лабрадор-ретривер", district: "tverskoy", comment: "Нашёлся благодаря соседям! Спасибо стае 🧡", radiusKm: 3, status: "found", lostAt: hoursAgo(30) },
  ];
  let firstActiveId = null;
  for (const r of reports) {
    const [lat, lng] = coords[r.district] ?? coords.khamovniki;
    const created = await db.lostReport.create({ data: { ...r, lat, lng, userId: anyaUser.id } });
    if (!firstActiveId && r.status === "active") firstActiveId = created.id;
  }
  if (firstActiveId) {
    const [lat, lng] = coords.khamovniki;
    await db.sighting.createMany({
      data: [
        { reportId: firstActiveId, lat: lat + 0.004, lng: lng + 0.006, comment: "Видел похожего пса у набережной, бежал к мосту." },
        { reportId: firstActiveId, lat: lat - 0.003, lng: lng - 0.002, comment: "Кто-то кормил рыжего во дворе на Льва Толстого." },
      ],
    });
  }

  const names = ["Барсик", "Лайма", "Граф", "Туман", "Ника", "Жуля", "Лорд", "Ася"];
  const dists = ["khamovniki", "presnensky", "yakimanka", "tverskoy", "sokol"];
  await db.foundEvent.createMany({
    data: Array.from({ length: 24 }, (_, i) => ({ petName: names[i % names.length], district: dists[i % dists.length] })),
  });

  // Находки: нашли чужую собаку — ищем владельца.
  await db.foundReport.createMany({
    data: [
      { userId: anyaUser.id, finderName: "Аня", contactTelegram: "@anya", breed: "Метис / не знаю", color: "рыжий", size: "medium", district: "khamovniki", lat: coords.khamovniki[0] + 0.005, lng: coords.khamovniki[1] - 0.004, comment: "Бегает у Парка культуры, без ошейника, идёт на руки. Приютила на ночь.", status: "open", createdAt: hoursAgo(3) },
      { finderName: "Марина", contactPhone: "+7 (905) 200-30-40", breed: "Шпиц", color: "белый", size: "small", district: "presnensky", lat: coords.presnensky[0] - 0.003, lng: coords.presnensky[1] + 0.003, comment: "Поймала во дворе, очень напуган, без документов. Ищу хозяина.", status: "open", createdAt: hoursAgo(10) },
      { finderName: "Дмитрий", contactPhone: "+7 (916) 555-11-22", breed: "Не знаю", color: "чёрный с подпалом", size: "large", district: "tverskoy", lat: coords.tverskoy[0] + 0.002, lng: coords.tverskoy[1] + 0.005, comment: "Большой пёс в синем ошейнике сидит у подъезда, ждёт кого-то.", status: "open", createdAt: hoursAgo(28) },
    ],
  });

  // Товары магазина.
  await db.product.createMany({
    data: [
      { slug: "addr-bone", name: "Адресник-косточка с QR", category: "addressniki", priceRub: 690, description: "Деревянная косточка с гравировкой и QR-кодом паспорта.", image: "/shop/merch-tags.png" },
      { slug: "addr-heart", name: "Адресник-сердечко", category: "addressniki", priceRub: 690, description: "Латунное сердечко с именем питомца и QR.", image: "/shop/merch-tags.png" },
      { slug: "bracelet-wood", name: "Браслет деревянный", category: "bracelets", priceRub: 1190, description: "Браслет ручной работы с бусиной-косточкой.", image: "/shop/merch-bracelet.png" },
      { slug: "bracelet-beads", name: "Браслет с бусинами", category: "bracelets", priceRub: 990, description: "Натуральные бусины и подвеска «Шуня».", image: "/shop/merch-bracelet.png" },
      { slug: "shopper-shunya", name: "Шоппер с Шуней", category: "merch", priceRub: 1290, description: "Плотный хлопковый шоппер с принтом Шуни.", image: null },
      { slug: "combo-starter", name: "Комбо «Стартер стаи»", category: "combo", priceRub: 1990, description: "Адресник + браслет + шоппер со скидкой.", image: null },
    ],
  });

  // Посты комьюнити.
  const p1 = await db.post.create({ data: { authorId: anyaUser.id, district: "khamovniki", type: "совет", text: "Перед салютами держите собаку на двойном поводке и шлейке — в панике многие срываются." } });
  await db.post.create({ data: { authorId: anyaUser.id, district: "khamovniki", type: "наблюдение", text: "На площадке у Льва Толстого видела дружелюбного рыжего метиса без ошейника. Если ваш — пишите." } });
  await db.post.create({ data: { authorId: anyaUser.id, district: "presnensky", type: "обсуждение", text: "Соседи, кто гуляет утром у Пресни? Давайте создадим утреннюю стаю для выгула!" } });
  await db.comment.create({ data: { postId: p1.id, authorId: anyaUser.id, text: "Подтверждаю, шлейка реально спасает." } });
  await db.postLike.create({ data: { postId: p1.id, userId: anyaUser.id } });

  await db.notification.createMany({
    data: [
      { userId: anyaUser.id, type: "sos", title: "Рядом ищут собаку", body: "В Хамовниках пропал Тиша (джек-рассел). Глянь по сторонам на прогулке.", link: "/feed/lost", read: false },
      { userId: anyaUser.id, type: "found", title: "Лорд нашёлся! 🧡", body: "Соседи помогли вернуть Лорда домой.", link: "/feed/found", read: true },
      { userId: anyaUser.id, type: "system", title: "Достижение «Сосед»", body: "Ты добавил первого питомца в стаю.", link: "/profile", read: false },
    ],
  });

  // Дневник здоровья демо-питомца «Шуня» (Лапка+).
  const shunyaPet = await db.pet.findFirst({ where: { name: "Шуня" } });
  if (shunyaPet) {
    const day = 86_400_000;
    await db.healthRecord.createMany({
      data: [
        { petId: shunyaPet.id, type: "vaccine", title: "Комплексная вакцина (DHPPi+L)", date: new Date(Date.now() - 200 * day), nextDue: new Date(Date.now() + 165 * day), note: "Клиника «Айболит»" },
        { petId: shunyaPet.id, type: "deworming", title: "Глистогонное (Мильбемакс)", date: new Date(Date.now() - 40 * day), nextDue: new Date(Date.now() - 5 * day) },
        { petId: shunyaPet.id, type: "weight", title: "Взвешивание", date: new Date(Date.now() - 10 * day), value: "9.8 кг" },
      ],
    });
  }

  const [pets, lost, found, products, posts, notifs] = await Promise.all([
    db.pet.count(), db.lostReport.count(), db.foundReport.count(), db.product.count(), db.post.count(), db.notification.count(),
  ]);
  console.log(`Seeded: user anya (demo1234), ${pets} pets, ${lost} reports, ${found} found, ${products} products, ${posts} posts, ${notifs} notifications.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
