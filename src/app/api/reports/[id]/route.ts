import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser, notifyMany } from "@/lib/notify";
import { censorProfanity } from "@/lib/profanity";

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

    // «Кто помог»: +1 helpedCount каждому уникальному автору наблюдений (не владельцу).
    // Идемпотентно: начисляем РОВНО ОДИН раз за всё время жизни розыска
    // (флаг helpersCreditedAt защищает от повторного кредита при reopen found→home→found).
    if (!report.helpersCreditedAt) {
      const seen = await db.sighting.findMany({
        where: { reportId: id, userId: { not: null } },
        select: { userId: true },
      });
      const helperIds = [
        ...new Set(
          seen
            .map((s) => s.userId)
            .filter(
              (uid): uid is string => Boolean(uid) && uid !== report.userId,
            ),
        ),
      ];
      for (const hid of helperIds) {
        await db.user.update({
          where: { id: hid },
          data: { helpedCount: { increment: 1 } },
        });
        await notifyUser(hid, {
          type: "found",
          title: "Спасибо! Ты помог найти 🐾",
          body: `Собака «${report.petName}» нашлась — твоё наблюдение помогло. +1 к «помог найти».`,
          link: "/profile/achievements",
        });
      }
      await db.lostReport.update({
        where: { id },
        data: { helpersCreditedAt: new Date() },
      });
    }
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

const SIZES = ["small", "medium", "large"];

// Редактирование своего объявления о пропаже: текстовые поля + награда. Только
// владелец. Статус/счётчики не трогаем — это отдельная ответственность PATCH.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  const report = await db.lostReport.findUnique({ where: { id } });
  // Чужое/несуществующее → 404 (не раскрываем существование).
  if (!report || report.userId !== user.id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const b = await req.json().catch(() => ({}));
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;
  const petName = typeof b?.petName === "string" ? b.petName.trim() : "";
  if (!petName) {
    return NextResponse.json({ error: "Кличка обязательна" }, { status: 400 });
  }
  const size = str(b?.size);
  const reward =
    typeof b?.reward === "number" && b.reward > 0
      ? Math.min(Math.round(b.reward), 1_000_000)
      : null;

  await db.lostReport.update({
    where: { id },
    data: {
      petName: petName.slice(0, 80),
      breed: str(b?.breed),
      color: str(b?.color),
      size: size && SIZES.includes(size) ? size : null,
      district: str(b?.district),
      reward,
      comment: censorProfanity(str(b?.comment)?.slice(0, 1000) ?? null),
    },
  });

  return NextResponse.json({ ok: true });
}
