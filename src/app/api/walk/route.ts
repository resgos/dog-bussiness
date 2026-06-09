import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * Отметиться «гуляю сейчас» — живые «глаза» района.
 * Активный чек-ин один на пользователя: прежние удаляем, создаём свежий.
 */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Нужно войти" }, { status: 401 });
  }
  if (!(await rateLimit(ipKey(req, "walk"), 6, 60_000))) {
    return NextResponse.json({ error: "Слишком часто." }, { status: 429 });
  }

  const b = await req.json().catch(() => null);

  // Один активный чек-ин на пользователя — прошлую прогулку заменяем новой.
  await db.walkCheckin.deleteMany({ where: { userId: me.id } });

  await db.walkCheckin.create({
    data: {
      userId: me.id,
      lat: num(b?.lat),
      lng: num(b?.lng),
      district: me.district ?? null,
      note: str(b?.note)?.slice(0, 120) ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

/** Завершить прогулку — снимаем все активные чек-ины пользователя. */
export async function DELETE() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Нужно войти" }, { status: 401 });
  }

  await db.walkCheckin.deleteMany({ where: { userId: me.id } });

  return NextResponse.json({ ok: true });
}
