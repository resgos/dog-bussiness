// Self-hosted инфра: фото на диск (STORAGE_DRIVER=local) + rate-limit в Redis.
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
const db = new PrismaClient();
const redis = new Redis("redis://localhost:6379", { maxRetriesPerRequest: 1 });
const BASE = "http://localhost:3002";
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };
const clearRl = async () => {
  for (const k of await redis.keys("rl:found:*")) await redis.del(k);
};
await clearRl();

console.log("— Фото на диск (STORAGE_DRIVER=local) —");
const r1 = await fetch(`${BASE}/api/found`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ finderName: "InfraTest", contactPhone: "+70000000000", breed: "тест", district: "khamovniki", photo: PNG }) });
const j1 = await r1.json();
const fr = await db.foundReport.findUnique({ where: { id: j1.id } });
ok(r1.status === 201 && fr?.photo?.startsWith("/api/uploads/"), `фото сохранено как файл, не data URL: ${fr?.photo}`);
const g = await fetch(`${BASE}${fr.photo}`);
const ct = g.headers.get("content-type") || "";
ok(g.status === 200 && ct.includes("image/png"), `/api/uploads отдаёт файл (${g.status}, ${ct})`);
ok((g.headers.get("cache-control") || "").includes("immutable"), `иммутабельный кэш`);

console.log("\n— Rate-limit в Redis (общий стор) —");
let got429 = false, posts = 1; // фото-запрос выше — уже 1
for (let i = 0; i < 7 && !got429; i++) {
  const r = await fetch(`${BASE}/api/found`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ finderName: "InfraTest", contactPhone: "+70000000000", district: "khamovniki" }) });
  posts++;
  if (r.status === 429) got429 = true;
}
ok(got429, `лимит сработал — 429 после превышения (за ${posts} запросов)`);
const keys = await redis.keys("rl:found:*");
const counts = (await Promise.all(keys.map((k) => redis.get(k)))).map(Number);
const maxc = counts.length ? Math.max(...counts) : 0;
ok(keys.length > 0 && maxc >= 5, `счётчик лимита в Redis: ${keys.join(",")} = ${maxc} (общий стор, не in-memory)`);
const ttl = keys.length ? await redis.pttl(keys[0]) : -2;
ok(ttl > 0 && ttl <= 60_000, `у ключа выставлен TTL окна: ${ttl} мс`);

console.log("\n— Уборка —");
await db.foundReport.deleteMany({ where: { finderName: "InfraTest" } });
await clearRl();
await redis.quit();
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
