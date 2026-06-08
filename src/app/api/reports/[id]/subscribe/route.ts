import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Переключатель подписки на объявление о пропаже.
// Подписчик получает уведомления о новых наблюдениях и смене статуса розыска.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!rateLimit(ipKey(req, "subscribe"), 30, 60_000)) {
    return NextResponse.json({ error: "Слишком часто." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const report = await db.lostReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const existing = await db.reportSubscription.findUnique({
    where: { userId_reportId: { userId: user.id, reportId: id } },
  });

  if (existing) {
    await db.reportSubscription.delete({
      where: { userId_reportId: { userId: user.id, reportId: id } },
    });
    return NextResponse.json({ following: false });
  }

  await db.reportSubscription.create({
    data: { userId: user.id, reportId: id },
  });
  return NextResponse.json({ following: true });
}

// Начальное состояние кнопки: следит ли текущий пользователь за этим розыском.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ following: false });
  }

  const existing = await db.reportSubscription.findUnique({
    where: { userId_reportId: { userId: user.id, reportId: id } },
  });
  return NextResponse.json({ following: Boolean(existing) });
}
