import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Подтверждение e-mail по одноразовому токену (мягкая верификация).
 * Тело: { token }. Токен должен существовать и не быть просроченным.
 * После успеха ставим emailVerifiedAt и гасим токен, чтобы им нельзя было
 * воспользоваться повторно. Вход этим не блокируется — это лишь бейдж.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { token?: unknown };
  const token = String(body.token ?? "").trim();

  if (!token) {
    return NextResponse.json(
      { error: "Ссылка недействительна или истекла." },
      { status: 400 },
    );
  }

  const record = await db.emailVerificationToken.findUnique({
    where: { token },
  });
  if (!record || record.expiresAt <= new Date()) {
    return NextResponse.json(
      { error: "Ссылка недействительна или истекла." },
      { status: 400 },
    );
  }

  // Помечаем e-mail подтверждённым и сразу удаляем токен.
  await db.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: new Date() },
  });
  await db.emailVerificationToken.delete({ where: { id: record.id } });

  return NextResponse.json({ ok: true });
}
