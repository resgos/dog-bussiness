// Демо бизнес-данных: партнёры-сервисы, собаки на пристройство, реф-код Ани.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();

await db.partner.deleteMany();
await db.partner.createMany({
  data: [
    { name: "Ветклиника «Айболит»", type: "vet", district: "khamovniki", address: "ул. Льва Толстого, 12", phone: "+7 (495) 120-30-40", description: "Круглосуточно, чипирование, вакцинация." },
    { name: "Ветцентр «Лапа и Хвост»", type: "vet", district: "presnensky", address: "Пресненский Вал, 5", phone: "+7 (495) 210-50-60", description: "Хирургия, УЗИ, стационар." },
    { name: "Груминг «Пушистик»", type: "groomer", district: "khamovniki", address: "Комсомольский пр-т, 28", phone: "+7 (916) 700-10-20", description: "Стрижка, гигиена, экспресс-линька." },
    { name: "Зоогостиница «Дом у реки»", type: "hotel", district: "yakimanka", address: "Якиманская наб., 4", phone: "+7 (903) 555-77-88", description: "Передержка с выгулом и видеонаблюдением." },
    { name: "Кинолог Андрей К.", type: "trainer", district: "tverskoy", phone: "+7 (925) 333-22-11", description: "ОКД, коррекция поведения, послушание." },
    { name: "Груминг-салон «Шерстюшка»", type: "groomer", district: "presnensky", address: "ул. 1905 года, 7", phone: "+7 (495) 640-12-34", description: "Породная стрижка, спа для лап." },
  ],
});

await db.adoptionListing.deleteMany();
await db.adoptionListing.createMany({
  data: [
    { name: "Бакс", breed: "Метис овчарки", age: "2 года", size: "large", color: "чёрно-рыжий", district: "presnensky", story: "Спасён с улицы, добрый и преданный, знает базовые команды. Ищет активную семью.", contactName: "Приют «Верный друг»", contactPhone: "+7 (495) 111-22-33", status: "open" },
    { name: "Ника", breed: "Дворняжка", age: "1 год", size: "medium", color: "рыжая", district: "khamovniki", story: "Молодая ласковая девочка, ладит с детьми и кошками. Стерилизована, привита.", contactName: "Волонтёр Ольга", contactTelegram: "@olga_help", status: "open" },
    { name: "Тёма", breed: "Той-терьер", age: "10 лет", size: "small", color: "коричневый", district: "tverskoy", story: "Пожилой малыш ищет спокойный дом и тёплые колени. Очень привязчивый.", contactName: "Приют «Лапки»", contactPhone: "+7 (499) 444-55-66", status: "open" },
  ],
});

const anya = await db.user.findFirst({ where: { name: "Аня" } });
if (anya && !anya.referralCode) {
  await db.user.update({ where: { id: anya.id }, data: { referralCode: randomBytes(5).toString("hex") } });
}
const refreshed = await db.user.findFirst({ where: { name: "Аня" } });
const [p, a] = await Promise.all([db.partner.count(), db.adoptionListing.count()]);
console.log(`partners: ${p}, adoption: ${a}, Аня referralCode: ${refreshed?.referralCode}`);
await db.$disconnect();
