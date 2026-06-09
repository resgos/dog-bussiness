import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { savePhoto } from "@/lib/storage";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Максимум дополнительных ракурсов на питомца (ТЗ 4.2: до 10 фото).
const MAX_PHOTOS = 10;
// Фото хранится как сжатый data URL — ограничиваем длину, чтобы не раздувать БД.
const MAX_URL_LEN = 3_000_000;

// POST — добавить дополнительное фото питомцу. Только владелец.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Защита от заливки: не больше 20 фото в минуту с одного IP.
  if (!(await rateLimit(ipKey(req, "petphoto"), 20, 60_000))) {
    return NextResponse.json(
      { error: "Слишком часто. Подождите немного." },
      { status: 429 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  // Нет питомца или это не его — 404, чтобы не раскрывать чужие карточки.
  const pet = await db.pet.findUnique({ where: { id } });
  if (!pet || pet.userId !== user.id) {
    return NextResponse.json({ error: "Питомец не найден" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url : "";
  if (!url.startsWith("data:image") || url.length > MAX_URL_LEN) {
    return NextResponse.json({ error: "Неверное фото" }, { status: 400 });
  }

  const count = await db.petPhoto.count({ where: { petId: id } });
  if (count >= MAX_PHOTOS) {
    return NextResponse.json({ error: "Максимум 10 фото" }, { status: 400 });
  }

  // url уже провалидирован как непустой data URL → savePhoto не вернёт null,
  // но подстрахуемся фолбэком, чтобы тип остался string.
  const storedUrl = (await savePhoto(url)) ?? url;

  const photo = await db.petPhoto.create({
    data: { petId: id, url: storedUrl, order: count },
  });

  return NextResponse.json({ id: photo.id, url: photo.url });
}

// DELETE — удалить дополнительное фото. Только владелец.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const photoId = typeof body.photoId === "string" ? body.photoId : "";

  // Фото должно существовать, относиться к этому питомцу и принадлежать владельцу.
  const photo = photoId
    ? await db.petPhoto.findUnique({
        where: { id: photoId },
        include: { pet: true },
      })
    : null;
  if (!photo || photo.petId !== id || photo.pet.userId !== user.id) {
    return NextResponse.json({ error: "Фото не найдено" }, { status: 404 });
  }

  await db.petPhoto.delete({ where: { id: photoId } });

  return NextResponse.json({ ok: true });
}
