import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Допустимые типы записей дневника здоровья — «Лапка+».
const HEALTH_TYPES = [
  "vaccine",
  "deworming",
  "weight",
  "treatment",
  "other",
] as const;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Разбирает дату из строки; возвращает Date или null, если значение невалидно. */
function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// POST — добавить запись в дневник здоровья. Только владелец питомца.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const petId = typeof body.petId === "string" ? body.petId : "";
  if (!petId) {
    return NextResponse.json({ error: "Не указан питомец" }, { status: 400 });
  }

  // Питомец должен существовать и принадлежать текущему пользователю.
  const pet = await db.pet.findUnique({ where: { id: petId } });
  if (!pet) {
    return NextResponse.json({ error: "Питомец не найден" }, { status: 404 });
  }
  if (pet.userId !== user.id) {
    return NextResponse.json({ error: "Это не ваш питомец" }, { status: 403 });
  }

  const type = typeof body.type === "string" ? body.type : "";
  if (!(HEALTH_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: "Неизвестный тип записи" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Укажите название записи" }, { status: 400 });
  }

  const date = parseDate(body.date);
  if (!date) {
    return NextResponse.json({ error: "Неверная дата" }, { status: 400 });
  }

  // nextDue необязательна; если передана — должна быть валидной датой.
  let nextDue: Date | null = null;
  if (typeof body.nextDue === "string" && body.nextDue.trim()) {
    nextDue = parseDate(body.nextDue);
    if (!nextDue) {
      return NextResponse.json(
        { error: "Неверная следующая дата" },
        { status: 400 },
      );
    }
  }

  await db.healthRecord.create({
    data: {
      petId: pet.id,
      type,
      title: title.slice(0, 120),
      date,
      nextDue,
      value: str(body.value),
      note: str(body.note),
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
