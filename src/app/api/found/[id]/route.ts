import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { censorProfanity } from "@/lib/profanity";

export const dynamic = "force-dynamic";

const ALLOWED = ["reunited", "open"];

// Сменить статус находки. Только владелец объявления (нашедший, если он был
// залогинен при публикации): «reunited» — хозяин нашёлся, «open» — вернуть в ленту.
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

  const report = await db.foundReport.findUnique({ where: { id } });
  // Чужую/гостевую находку не трогаем: и «нет», и «не твоя» → 404.
  if (!report || report.userId !== user.id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const updated = await db.foundReport.update({
    where: { id },
    data: { status: next },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}

const SIZES = ["small", "medium", "large"];

// Редактирование своей находки: контакты нашедшего + приметы. Только владелец.
// Статус не трогаем — это отдельная ответственность PATCH.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  const report = await db.foundReport.findUnique({ where: { id } });
  if (!report || report.userId !== user.id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const b = await req.json().catch(() => ({}));
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;
  const size = str(b?.size);

  await db.foundReport.update({
    where: { id },
    data: {
      finderName: str(b?.finderName)?.slice(0, 80) ?? null,
      contactPhone: str(b?.contactPhone)?.slice(0, 40) ?? null,
      contactTelegram: str(b?.contactTelegram)?.slice(0, 80) ?? null,
      breed: str(b?.breed)?.slice(0, 80) ?? null,
      color: str(b?.color)?.slice(0, 80) ?? null,
      size: size && SIZES.includes(size) ? size : null,
      district: str(b?.district),
      comment: censorProfanity(str(b?.comment)?.slice(0, 1000) ?? null),
    },
  });

  return NextResponse.json({ ok: true });
}
