import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Считаем при каждом запросе, без кэша.
export const dynamic = "force-dynamic";

/** «Собак найдено сегодня» — реальное число событий FoundEvent за сегодня. */
export async function GET() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const count = await db.foundEvent.count({
    where: { createdAt: { gte: start } },
  });

  return NextResponse.json(
    { count, date: start.toISOString().slice(0, 10) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
