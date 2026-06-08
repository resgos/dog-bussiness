import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (typeof v === "string" && v ? v : null);

// Поля, которые владелец может править из карточки питомца.
const ALLOWED_STATUS = ["home", "lost", "found"] as const;

// PATCH — обновить данные питомца. Только владелец.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const pet = await db.pet.findUnique({ where: { id } });
  // Не раскрываем чужие карточки: и «нет», и «не твой» отдают 404.
  if (!pet || pet.userId !== user.id) {
    return NextResponse.json({ error: "Питомец не найден" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Кличка обязательна" }, { status: 400 });
  }

  const status =
    typeof body.status === "string" &&
    (ALLOWED_STATUS as readonly string[]).includes(body.status)
      ? body.status
      : pet.status;

  await db.pet.update({
    where: { id },
    data: {
      name: name.slice(0, 80),
      breed: str(body.breed),
      sex: str(body.sex),
      age: str(body.age),
      size: str(body.size),
      color: str(body.color),
      district: str(body.district),
      ownerPhone: str(body.ownerPhone),
      telegram: str(body.telegram),
      showPhone: Boolean(body.showPhone),
      marksText: str(body.marksText),
      status,
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — удалить питомца. Только владелец.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const pet = await db.pet.findUnique({ where: { id } });
  if (!pet || pet.userId !== user.id) {
    return NextResponse.json({ error: "Питомец не найден" }, { status: 404 });
  }

  await db.pet.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
