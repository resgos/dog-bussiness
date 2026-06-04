import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Отметить уведомления прочитанными: {id} — одну (только свою),
// {} — все непрочитанные пользователя.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const id = typeof body?.id === "string" ? body.id : null;

  if (id) {
    // Фильтр И по userId — нельзя пометить чужое уведомление.
    await db.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
  } else {
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ ok: true });
}
