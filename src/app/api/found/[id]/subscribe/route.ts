import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Переключатель подписки на находку.
// Подписчик получает уведомления о смене статуса находки и связанных событиях.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!rateLimit(ipKey(req, "foundsub"), 30, 60_000)) {
    return NextResponse.json({ error: "Слишком часто." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const found = await db.foundReport.findUnique({ where: { id } });
  if (!found) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const existing = await db.foundSubscription.findUnique({
    where: { userId_foundId: { userId: user.id, foundId: id } },
  });

  if (existing) {
    await db.foundSubscription.delete({
      where: { userId_foundId: { userId: user.id, foundId: id } },
    });
    return NextResponse.json({ following: false });
  }

  await db.foundSubscription.create({
    data: { userId: user.id, foundId: id },
  });
  return NextResponse.json({ following: true });
}

// Начальное состояние кнопки: следит ли текущий пользователь за этой находкой.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ following: false });
  }

  const existing = await db.foundSubscription.findUnique({
    where: { userId_foundId: { userId: user.id, foundId: id } },
  });
  return NextResponse.json({ following: Boolean(existing) });
}
