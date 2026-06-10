import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { savePhoto } from "@/lib/storage";
import { censorProfanity } from "@/lib/profanity";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const MAX_PHOTO = 3_000_000;

/** Последние истории воссоединения — публичная лента «Истории спасения». */
export async function GET() {
  const items = await db.reunion.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ items });
}

/** Публикация истории: только авторизованный владелец, с рейт-лимитом. */
export async function POST(req: Request) {
  if (!(await rateLimit(ipKey(req, "reunion"), 5, 60_000))) {
    return NextResponse.json(
      { error: "Слишком часто — попробуйте через минуту." },
      { status: 429 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нужно войти" }, { status: 401 });
  }

  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const petName =
    typeof b.petName === "string" ? b.petName.trim() : "";
  const story = typeof b.story === "string" ? b.story.trim() : "";

  if (!petName || petName.length > 80) {
    return NextResponse.json(
      { error: "Укажите кличку (до 80 символов)." },
      { status: 400 },
    );
  }
  if (!story || story.length > 2000) {
    return NextResponse.json(
      { error: "Расскажите историю (до 2000 символов)." },
      { status: 400 },
    );
  }

  // Фото опционально: если есть — это data:image и не больше лимита.
  let photo: string | null = null;
  if (b.photo != null && b.photo !== "") {
    if (
      typeof b.photo !== "string" ||
      b.photo.length > MAX_PHOTO ||
      !b.photo.startsWith("data:image")
    ) {
      return NextResponse.json(
        { error: "Некорректное фото." },
        { status: 400 },
      );
    }
    photo = await savePhoto(b.photo);
  }

  const district =
    typeof b.district === "string" && b.district.trim()
      ? b.district.trim()
      : null;
  const reportId =
    typeof b.reportId === "string" && b.reportId.trim()
      ? b.reportId.trim()
      : null;

  const created = await db.reunion.create({
    data: {
      petName,
      story: censorProfanity(story),
      photo,
      district,
      userId: user.id,
      reportId,
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
