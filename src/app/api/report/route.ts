import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Допустимые значения — синхронизированы со схемой Report (prisma).
const TARGET_TYPES = ["post", "found", "lost", "comment"] as const;
const REASONS = ["spam", "abuse", "fake", "other"] as const;

const str = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : null;

// Пожаловаться на контент. Доступно всем (в т.ч. гостям) — личность жалующегося
// фиксируем, только если он залогинен. Жалобы попадают в очередь модерации.
export async function POST(req: Request) {
  if (!rateLimit(ipKey(req, "report"), 10, 60_000)) {
    return NextResponse.json(
      { error: "Слишком часто — попробуйте через минуту." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);

  const targetType = str(body?.targetType);
  const targetId = str(body?.targetId);
  const reason = str(body?.reason);
  const comment = str(body?.comment);

  if (!targetType || !TARGET_TYPES.includes(targetType as (typeof TARGET_TYPES)[number])) {
    return NextResponse.json({ error: "Неизвестный тип контента" }, { status: 400 });
  }
  if (!targetId) {
    return NextResponse.json({ error: "Не указан объект жалобы" }, { status: 400 });
  }
  if (!reason || !REASONS.includes(reason as (typeof REASONS)[number])) {
    return NextResponse.json({ error: "Выберите причину" }, { status: 400 });
  }

  const user = await getCurrentUser().catch(() => null);

  await db.report.create({
    data: {
      targetType,
      targetId,
      reason,
      comment: comment?.slice(0, 1000) ?? null,
      reporterId: user?.id ?? null,
      status: "open",
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
