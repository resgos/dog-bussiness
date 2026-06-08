import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Кто может закрывать жалобы.
const MOD_ROLES = ["ambassador", "admin"];
// Допустимые целевые статусы при разборе жалобы.
const ALLOWED = ["resolved", "dismissed"] as const;

// Изменить статус жалобы (разобрать очередь модерации).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser().catch(() => null);
  if (!user || !MOD_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status =
    typeof body?.status === "string" ? body.status : "";
  if (!ALLOWED.includes(status as (typeof ALLOWED)[number])) {
    return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
  }

  const existing = await db.report.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Жалоба не найдена" }, { status: 404 });
  }

  await db.report.update({ where: { id }, data: { status } });

  return NextResponse.json({ ok: true });
}
