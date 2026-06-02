import { NextResponse } from "next/server";

// Считаем на сервере при каждом запросе (не кэшируем).
export const dynamic = "force-dynamic";

/**
 * «Собак найдено сегодня». Пока без БД — детерминированно по дню года,
 * с лёгким приростом в течение дня, чтобы число выглядело живым.
 * Позже заменим на реальный агрегат из базы.
 */
export function GET() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const base = 28 + (dayOfYear % 27); // 28..54
  const hourBump = Math.floor(now.getHours() / 3); // 0..7 в течение дня
  const count = base + hourBump;

  return NextResponse.json(
    { count, date: now.toISOString().slice(0, 10) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
