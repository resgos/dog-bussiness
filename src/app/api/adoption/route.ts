import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { savePhoto } from "@/lib/storage";
import { censorProfanity } from "@/lib/profanity";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const str = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : null;

const SIZES = ["small", "medium", "large"];

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }
  if (!(await rateLimit(ipKey(req, "adoption"), 5, 60_000))) {
    return NextResponse.json(
      { error: "Слишком часто — попробуйте через минуту." },
      { status: 429 },
    );
  }

  // Кличка обязательна — без неё объявление о пристройстве бессмысленно.
  const name = str(b.name);
  if (!name) {
    return NextResponse.json(
      { error: "Укажите кличку собаки." },
      { status: 400 },
    );
  }

  const size = str(b.size);

  // Фото опционально, но если есть — это data:image и не больше лимита (как в reunions).
  const photo = str(b.photo);
  if (photo && (photo.length > 3_000_000 || !photo.startsWith("data:image"))) {
    return NextResponse.json({ error: "Некорректное фото." }, { status: 400 });
  }

  const user = await getCurrentUser().catch(() => null);

  const listing = await db.adoptionListing.create({
    data: {
      name: name.slice(0, 80),
      breed: str(b.breed)?.slice(0, 80) ?? null,
      age: str(b.age)?.slice(0, 40) ?? null,
      size: size && SIZES.includes(size) ? size : null,
      color: str(b.color)?.slice(0, 80) ?? null,
      photo: await savePhoto(photo),
      district: str(b.district),
      story: censorProfanity(str(b.story)?.slice(0, 1500) ?? null),
      contactName:
        str(b.contactName)?.slice(0, 80) ?? user?.name?.slice(0, 80) ?? null,
      contactPhone: str(b.contactPhone)?.slice(0, 40) ?? null,
      contactTelegram: str(b.contactTelegram)?.slice(0, 80) ?? null,
      status: "open",
    },
  });

  return NextResponse.json({ id: listing.id }, { status: 201 });
}
