import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  vaccine: "Прививка",
  deworming: "Обработка от паразитов",
  weight: "Взвешивание",
  treatment: "Лечение",
  other: "Здоровье",
};

// Удаляет управляющие символы (всё < 0x20, кроме \t \n \r): они недопустимы и
// ломают импорт .ics в Google/Apple Calendar.
function stripCtl(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    if (c < 32 && c !== 9 && c !== 10 && c !== 13) continue;
    out += ch;
  }
  return out;
}

// Экранирование текстовых значений iCalendar (RFC 5545 §3.3.11). Нормализуем ВСЕ
// переводы строк, включая одиночный \r, иначе он остаётся в строке и рвёт CRLF.
function esc(s: string): string {
  return stripCtl(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

// Складывание длинных строк по 75 октетов (продолжение — строка с ведущим
// пробелом). Считаем по байтам: кириллица — 2 октета, иначе режется неверно.
function fold(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= 75) return line;
  const chunks: string[] = [];
  let cur = "";
  let curBytes = 0;
  for (const ch of line) {
    const chBytes = Buffer.byteLength(ch, "utf8");
    const limit = chunks.length === 0 ? 75 : 74;
    if (curBytes + chBytes > limit) {
      chunks.push(cur);
      cur = "";
      curBytes = 0;
    }
    cur += ch;
    curBytes += chBytes;
  }
  if (cur) chunks.push(cur);
  return chunks.join("\r\n ");
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// Экспорт напоминаний дневника здоровья в .ics: владелец добавляет даты следующих
// прививок/обработок к себе в календарь (Google/Apple) и не пропускает сроки.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  const pet = await db.pet.findUnique({ where: { id } });
  // Чужой/несуществующий питомец → 404, не раскрываем данные.
  if (!pet || pet.userId !== user.id) {
    return NextResponse.json({ error: "Питомец не найден" }, { status: 404 });
  }

  const records = await db.healthRecord.findMany({
    where: { petId: id, nextDue: { not: null } },
    orderBy: { nextDue: "asc" },
  });

  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Лапка помощи//Дневник здоровья//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:Здоровье · ${esc(pet.name)}`),
  ];
  for (const r of records) {
    if (!r.nextDue) continue;
    const due = new Date(r.nextDue);
    const next = new Date(due.getTime() + 86_400_000); // DTEND = следующий день (all-day)
    const typeLabel = TYPE_LABEL[r.type] ?? "Здоровье";
    const summary = `${pet.name}: ${typeLabel} — ${r.title}`;
    const descParts = [r.value ? `Показатель: ${r.value}` : null, r.note].filter(
      (v): v is string => Boolean(v),
    );
    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:health-${r.id}@lapka-pomoshchi.ru`),
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${ymd(due)}`,
      `DTEND;VALUE=DATE:${ymd(next)}`,
      fold(`SUMMARY:${esc(summary)}`),
      ...(descParts.length ? [fold(`DESCRIPTION:${esc(descParts.join(". "))}`)] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n") + "\r\n";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="lapka-health-${id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
