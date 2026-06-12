import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MIN_PASSWORD = 6;

/**
 * Установка нового пароля по одноразовому токену (ТЗ 4.1).
 * Тело: { token, password }. Токен должен существовать, быть неиспользованным
 * и не просроченным. После успеха токен помечается usedAt.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    token?: unknown;
    password?: unknown;
  };
  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "");

  if (!token) {
    return NextResponse.json(
      { error: "Ссылка недействительна — запроси сброс пароля заново." },
      { status: 400 },
    );
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `Пароль коротковат — нужно минимум ${MIN_PASSWORD} символов.` },
      { status: 400 },
    );
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Ссылка устарела или уже использована. Запроси сброс заново." },
      { status: 400 },
    );
  }

  // Меняем пароль и сразу гасим токен, чтобы им нельзя было воспользоваться повторно.
  await db.user.update({
    where: { id: record.userId },
    data: { passwordHash: hashPassword(password) },
  });
  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  // Безопасность: гасим ВСЕ активные сессии пользователя (вдруг ими завладел
  // злоумышленник — ради этого пароль и сбрасывают) и прочие неиспользованные
  // токены сброса, чтобы валиден остался только что использованный.
  await db.session.deleteMany({ where: { userId: record.userId } });
  await db.passwordResetToken.updateMany({
    where: { userId: record.userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
