import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyMany } from "@/lib/notify";

export const dynamic = "force-dynamic";

const ALLOWED = ["found", "home", "active"];

// Сменить статус объявления. "found" может отметить любой залогиненный участник
// (community «Нашлась!»); снятие/возврат в активные — только владелец.
// При переходе в "found" создаём событие счётчика «найдено сегодня».
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const next =
    typeof body?.status === "string" && ALLOWED.includes(body.status)
      ? body.status
      : null;
  if (!next) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }

  const report = await db.lostReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Снять с публикации / вернуть в активные может только владелец объявления.
  if (next !== "found" && report.userId && report.userId !== user.id) {
    return NextResponse.json(
      { error: "Можно менять только свои объявления" },
      { status: 403 },
    );
  }

  const updated = await db.lostReport.update({
    where: { id },
    data: { status: next },
  });

  if (next === "found" && report.status !== "found") {
    await db.foundEvent.create({
      data: { petName: report.petName, district: report.district },
    });
  }

  // Уведомляем подписчиков розыска о смене статуса. Некритично → не валим ответ.
  try {
    const subs = await db.reportSubscription.findMany({
      where: { reportId: id },
      select: { userId: true },
    });
    await notifyMany(
      subs.map((s) => s.userId),
      {
        type: next === "found" ? "found" : "info",
        title: next === "found" ? "Нашлась! 🎉" : "Обновление поиска",
        body: `Статус розыска «${report.petName}»: ${
          next === "found"
            ? "найдена"
            : next === "home"
              ? "дома"
              : "активный поиск"
        }`,
        link: "/feed/lost",
      },
    );
  } catch {
    /* уведомления подписчикам некритичны — игнорируем */
  }

  return NextResponse.json({ ok: true, status: updated.status });
}
