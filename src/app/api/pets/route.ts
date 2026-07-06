import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { savePhoto, isStorablePhoto } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Раньше без авторизации и без where отдавал приватные поля (ownerPhone,
// extraPhone, telegram, address, chip) ВСЕХ питомцев мимо флага showPhone —
// массовый слив PII владельцев. Теперь — только свои карточки вошедшему.
export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  const pets = await db.pet.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ pets });
}

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

export async function POST(req: Request) {
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

  const str = (v: unknown) => (typeof v === "string" && v ? v : null);

  // Фото опционально, но если есть — это data:image в пределах лимита
  // (savePhoto размер не проверяет → иначе DB-блоат/DoS большим data URL).
  const photo = str(body.photo);
  if (!isStorablePhoto(photo)) {
    return NextResponse.json({ error: "Некорректное фото." }, { status: 400 });
  }

  // Привязываем карточку к владельцу, если он залогинен: иначе питомец
  // остаётся «бесхозным» (userId=null) и владелец не может его править/удалять
  // — PATCH/DELETE /api/pets/[id] проверяют pet.userId === user.id.
  const owner = await getCurrentUser().catch(() => null);

  const pet = await db.pet.create({
    data: {
      userId: owner?.id ?? null,
      name: name.slice(0, 80),
      breed: str(body.breed),
      sex: str(body.sex),
      age: str(body.age),
      size: str(body.size),
      color: str(body.color),
      marks: JSON.stringify(asArray(body.marks)),
      chip: str(body.chip),
      marksText: str(body.marksText),
      district: str(body.district),
      address: str(body.address),
      walkSpots: JSON.stringify(asArray(body.walkSpots)),
      temperament: JSON.stringify(asArray(body.temperament)),
      ownerPhone: str(body.ownerPhone),
      extraPhone: str(body.extraPhone),
      telegram: str(body.telegram),
      showPhone: Boolean(body.showPhone),
      photo: await savePhoto(photo),
      photoHash: str(body.photoHash),
    },
  });

  return NextResponse.json({ id: pet.id }, { status: 201 });
}
