import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/verify";

export const dynamic = "force-dynamic";

/**
 * Повторная отправка письма с подтверждением e-mail.
 * Только для вошедшего пользователя. Если e-mail уже подтверждён —
 * отвечаем { ok: true, already: true } и письмо не шлём.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, already: true });
  }

  if (user.email) {
    // sendVerificationEmail сам глотает ошибки почты — ответ не должен падать.
    await sendVerificationEmail(user.id, user.email);
  }

  return NextResponse.json({ ok: true });
}
