// Проверка экспорта напоминаний здоровья в .ics (GET /api/pets/[id]/health/calendar):
// auth-гейт, ownership, заголовки скачивания и валидность VCALENDAR/VEVENT.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const mkSession = async (name) => {
  const token = randomBytes(32).toString("hex");
  const user = await db.user.create({ data: { name, email: `cal+${name}-${Date.now()}@lapka.test` } });
  await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 86400000) } });
  return { user, cookie: `lapka_session=${token}` };
};

const owner = await mkSession("Владелец");
const other = await mkSession("Чужой");
const pet = await db.pet.create({ data: { userId: owner.user.id, name: "Тест-Барбос-Кал" } });
const due = new Date(Date.now() + 14 * 86400000); // через 2 недели
await db.healthRecord.create({
  data: { petId: pet.id, type: "vaccine", title: "Бешенство", date: new Date(), nextDue: due },
});

// Без сессии → 401.
const anon = await fetch(`${BASE}/api/pets/${pet.id}/health/calendar`);
ok(anon.status === 401, `без сессии → 401 (${anon.status})`);

// Чужой → 404.
const foreign = await fetch(`${BASE}/api/pets/${pet.id}/health/calendar`, { headers: { cookie: other.cookie } });
ok(foreign.status === 404, `чужой питомец → 404 (${foreign.status})`);

// Владелец → 200 .ics.
const res = await fetch(`${BASE}/api/pets/${pet.id}/health/calendar`, { headers: { cookie: owner.cookie } });
ok(res.status === 200, `владелец → 200 (${res.status})`);
ok((res.headers.get("content-type") || "").includes("text/calendar"), "Content-Type: text/calendar");
ok(/attachment; filename=".*\.ics"/.test(res.headers.get("content-disposition") || ""), "Content-Disposition: attachment .ics");
const ics = await res.text();
// RFC 5545: длинные строки складываются «CRLF + пробел» — перед проверкой контента
// разворачиваем обратно (клиенты делают так же).
const unfolded = ics.replace(/\r\n[ \t]/g, "");
ok(ics.includes("BEGIN:VCALENDAR") && ics.includes("END:VCALENDAR"), "валидная обёртка VCALENDAR");
ok((ics.match(/BEGIN:VEVENT/g) || []).length === 1, "одно событие VEVENT");
ok(unfolded.includes("Тест-Барбос-Кал") && unfolded.includes("Бешенство"), "питомец и запись в SUMMARY (после разворота фолдинга)");
const y = due.getUTCFullYear(), m = String(due.getUTCMonth() + 1).padStart(2, "0"), d = String(due.getUTCDate()).padStart(2, "0");
ok(ics.includes(`DTSTART;VALUE=DATE:${y}${m}${d}`), "дата следующего срока в DTSTART");

// Очистка.
await db.healthRecord.deleteMany({ where: { petId: pet.id } }).catch(() => {});
await db.pet.delete({ where: { id: pet.id } }).catch(() => {});
for (const s of [owner, other]) {
  await db.session.deleteMany({ where: { userId: s.user.id } }).catch(() => {});
  await db.user.delete({ where: { id: s.user.id } }).catch(() => {});
}
await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
