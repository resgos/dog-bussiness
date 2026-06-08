// Бенчмарк оптимизаций (OLD vs NEW в одном прогоне), как требует методология:
//   1) feed/lost: include sightings:true  vs  sightings:{select id}
//   2) my-searches founds: findMany(all)   vs  select без photo
//   3) поиск по чипу: seq scan (без индекса) vs index scan
// Сидит синтетическую нагрузку под id-префиксом "perf-", печатает мс и байты,
// затем всё подчищает.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const PHOTO = "data:image/jpeg;base64," + "A".repeat(30_000); // ~30 КБ как реальное фото
const LOSTN = 200;
const SIGHT_PER = 3;
const FOUNDN = 200;
const PETN = 5000;
const DISTRICTS = ["khamovniki", "tverskoy", "presnenskiy", "basmanny", "arbat"];
const BREEDS = ["корги", "лабрадор", "хаски", "метис", "шпиц"];
const COLORS = ["рыжий", "чёрный", "белый", "палевый", "серый"];
const SIZES = ["small", "medium", "large"];

const mb = (bytes) => (bytes / 1_048_576).toFixed(2);
const bytesOf = (x) => Buffer.byteLength(JSON.stringify(x));
async function timeIt(fn, runs = 5) {
  // прогрев
  await fn();
  const t0 = performance.now();
  let last;
  for (let i = 0; i < runs; i++) last = await fn();
  const ms = (performance.now() - t0) / runs;
  return { ms, last };
}
async function chunkedCreate(model, rows, size = 100) {
  for (let i = 0; i < rows.length; i += size) {
    await model.createMany({ data: rows.slice(i, i + size) });
  }
}

console.log("Сидирую синтетическую нагрузку…");
await db.user.create({ data: { id: "perf-user", name: "Perf", email: "perf@e.local", passwordHash: "x:y", referralCode: "perfxx" } });

// LostReport + наблюдения
const lostRows = [];
const sightRows = [];
for (let i = 0; i < LOSTN; i++) {
  const id = `perf-lost-${i}`;
  lostRows.push({
    id, userId: "perf-user", petName: `Пёс${i}`, breed: BREEDS[i % 5], photo: PHOTO,
    district: DISTRICTS[i % 5], lat: 55.7 + i * 1e-4, lng: 37.6 + i * 1e-4,
    radiusKm: 3, status: "active",
  });
  for (let s = 0; s < SIGHT_PER; s++) {
    sightRows.push({ id: `perf-sight-${i}-${s}`, reportId: id, lat: 55.7, lng: 37.6, comment: "видели у парка", photo: PHOTO });
  }
}
await chunkedCreate(db.lostReport, lostRows);
await chunkedCreate(db.sighting, sightRows);

// FoundReport
const foundRows = [];
for (let i = 0; i < FOUNDN; i++) {
  foundRows.push({
    id: `perf-found-${i}`, userId: "perf-user", finderName: `Нашёл${i}`, contactPhone: "+70000000000",
    photo: PHOTO, breed: BREEDS[i % 5], color: COLORS[i % 5], size: SIZES[i % 3],
    district: DISTRICTS[i % 5], status: "open",
  });
}
await chunkedCreate(db.foundReport, foundRows);

// Pets с чипами (для теста индекса)
const petRows = [];
for (let i = 0; i < PETN; i++) {
  petRows.push({ id: `perf-pet-${i}`, userId: "perf-user", name: `P${i}`, status: "home", chip: "643" + String(100000000000 + i) });
}
await chunkedCreate(db.pet, petRows, 500);
console.log(`Готово: ${LOSTN} пропаж + ${sightRows.length} наблюдений + ${FOUNDN} находок + ${PETN} питомцев с чипами.\n`);

// ——— 1) feed/lost: sightings:true vs sightings:{select id} ———
console.log("① Лента /feed/lost — наблюдения целиком vs только id");
const a1 = await timeIt(() => db.lostReport.findMany({ where: { status: "active", userId: "perf-user" }, orderBy: { createdAt: "desc" }, include: { sightings: true } }));
const b1 = await timeIt(() => db.lostReport.findMany({ where: { status: "active", userId: "perf-user" }, orderBy: { createdAt: "desc" }, include: { sightings: { select: { id: true } } } }));
const a1b = bytesOf(a1.last), b1b = bytesOf(b1.last);
console.log(`   OLD include sightings:true     → ${a1.ms.toFixed(1)} мс, ${mb(a1b)} МБ`);
console.log(`   NEW sightings:{select id}      → ${b1.ms.toFixed(1)} мс, ${mb(b1b)} МБ`);
console.log(`   ⇒ payload −${(100 - (b1b / a1b) * 100).toFixed(1)}% , время −${(100 - (b1.ms / a1.ms) * 100).toFixed(0)}%\n`);

// ——— 2) my-searches founds: all vs select без photo ———
console.log("② Матчинг /profile/my-searches — находки целиком vs select без photo");
const a2 = await timeIt(() => db.foundReport.findMany({ where: { status: "open", userId: "perf-user" } }));
const b2 = await timeIt(() => db.foundReport.findMany({ where: { status: "open", userId: "perf-user" }, select: { id: true, breed: true, color: true, size: true, district: true, createdAt: true } }));
const a2b = bytesOf(a2.last), b2b = bytesOf(b2.last);
console.log(`   OLD findMany(all поля + photo) → ${a2.ms.toFixed(1)} мс, ${mb(a2b)} МБ`);
console.log(`   NEW select без photo           → ${b2.ms.toFixed(1)} мс, ${mb(b2b)} МБ`);
console.log(`   ⇒ payload −${(100 - (b2b / a2b) * 100).toFixed(1)}% , время −${(100 - (b2.ms / a2.ms) * 100).toFixed(0)}%\n`);

// ——— 3) поиск по чипу: seq scan vs index scan ———
console.log("③ Поиск по чипу — без индекса (seq scan) vs с индексом (index scan)");
const target = "643" + String(100000000000 + PETN - 1); // последний — худший случай для seq scan
const planLine = (rows) => String(rows[0]["QUERY PLAN"]).trim();
const planOld = await db.$queryRawUnsafe('EXPLAIN ANALYZE SELECT * FROM "Pet" WHERE chip = $1', target);
const tOld = await timeIt(() => db.pet.findFirst({ where: { chip: target } }), 20);
console.log(`   OLD план: ${planLine(planOld)}`);
console.log(`   OLD время findFirst(chip) ×20  → ${tOld.ms.toFixed(2)} мс`);
await db.$executeRawUnsafe('CREATE INDEX "perf_pet_chip" ON "Pet"(chip)');
const planNew = await db.$queryRawUnsafe('EXPLAIN ANALYZE SELECT * FROM "Pet" WHERE chip = $1', target);
const tNew = await timeIt(() => db.pet.findFirst({ where: { chip: target } }), 20);
console.log(`   NEW план: ${planLine(planNew)}`);
console.log(`   NEW время findFirst(chip) ×20  → ${tNew.ms.toFixed(2)} мс`);
console.log(`   ⇒ время поиска по чипу −${(100 - (tNew.ms / tOld.ms) * 100).toFixed(0)}% (×${(tOld.ms / tNew.ms).toFixed(0)} быстрее)`);
await db.$executeRawUnsafe('DROP INDEX "perf_pet_chip"'); // постоянный индекс ставит миграция

// ——— уборка ———
console.log("\nУбираю нагрузку…");
await db.sighting.deleteMany({ where: { id: { startsWith: "perf-" } } });
await db.lostReport.deleteMany({ where: { id: { startsWith: "perf-" } } });
await db.foundReport.deleteMany({ where: { id: { startsWith: "perf-" } } });
await db.pet.deleteMany({ where: { id: { startsWith: "perf-" } } });
await db.user.deleteMany({ where: { id: "perf-user" } });
await db.$disconnect();
console.log("Готово.");
